
var Parse = require('parse/node');
// var moment = require('moment');
// var fs = require('fs');
// var gm = require('gm');
var async = require('async');
var serverConfig = require('../constants/AppConfig').default;
var self = module.exports;

Parse.initialize( serverConfig.appId ); // Parse initialize with appId
Parse.masterKey = serverConfig.masterKey;
Parse.serverURL = serverConfig.serverURL; // Parse Server URL
// we don't use the Parse.User.current, but we do want to re-create users from session tokens!
Parse.User.enableUnsafeCurrentUser();

function getClientId(user) {
	return user.get('clientName').split(" ").join("") + "ClientId";
};

function getResizedImage(base64, maxWidth, maxHeight, callback){
   // Max size for thumbnail
   if(typeof(maxWidth) === 'undefined')  maxWidth = 500;
   if(typeof(maxHeight) === 'undefined')  maxHeight = 500;

   // Create and initialize two canvas
   var canvas = document.createElement("canvas");
   var ctx = canvas.getContext("2d");
   var canvasCopy = document.createElement("canvas");
   var copyContext = canvasCopy.getContext("2d");

   // Create original image
   var img = new Image();
   img.src = base64;
   img.onload = () => {
      // Determine new ratio based on max size
      var ratio = 1;
      if(img.naturalWidth > maxWidth)
         ratio = maxWidth / img.naturalWidth;
      else if(img.naturalHeight > maxHeight)
         ratio = maxHeight / img.naturalHeight;

      // Draw original image in second canvas
      canvasCopy.width = img.naturalWidth;
      canvasCopy.height = img.naturalHeight;
      copyContext.drawImage(img, 0, 0);

      // Copy and resize second canvas to first canvas
      canvas.width = img.naturalWidth * ratio;
      canvas.height = img.naturalHeight * ratio;
      ctx.drawImage(canvasCopy, 0, 0, canvasCopy.width, canvasCopy.height, 0, 0, canvas.width, canvas.height);

      callback(null, canvas.toDataURL());
   }
   img.onerror = (err) => {
      callback(err, null);
   }
};

function getBase64(file) {
   return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
   });
}

exports.getTokenForUsernamePassword = function( username, password, callback )
{
   Parse.User.logIn( username, password)
      .then(function (user) {
         // Do stuff after successful login.
         var token = user.getSessionToken();
         var clientName = user.get('clientName');
         callback( null, token, clientName );
      }, function (error) {
         // The login failed. Check error to see why.
         callback( error, null, null );
      });
};

exports.createUserFromToken = function( token, callback )
{
   // this allows a user to login with a valid token
   Parse.User.become( token )
      .then(function (user) {
         // The current user is now set to user.
         // console.log("created user with token", user.authenticated(), user );
         callback( null, user );
      }, function (error) {
         // The token could not be validated.
         //console.log("couldn't create user with token :'(")
         callback( error, null );
      });
};

exports.getSubscriptionId = function( user, callback ) {
   if (user) {
      var Subscription = Parse.Object.extend("Subscription");
      var query = new Parse.Query(Subscription);
      
      var clientId = getClientId(user);

      query.equalTo("clientId",clientId);
      query.find()
         .then(function(results) {
            if (results.length === 0) {
               // isNotSubscribed
               callback(null, null);
            } else {
               // isSubscribed
               var res = {
                  sub_id: results[0].get('subscriptionId'),
                  payment_intent: results[0].get('paymentIntent'),
                  trial_start: results[0].get('trialStart'),
                  trial_end: results[0].get('trialEnd'),
                  current_period_start: results[0].get('currentPeriodStart'),
                  current_period_end: results[0].get('currentPeriodEnd'),
                  subscription_created: results[0].get('subscriptionCreated'),
                  interval: results[0].get('interval')
               };

               callback(null, res);
            }
         })
         .catch(function(err) {
            callback(err, null);
         });
   }
};

exports.UpdateSubscription = function( user, payment_intent, trial_start, trial_end, subscription_created, current_period_start, current_period_end, interval, subscription_id, callback ) {
   var Subscription = Parse.Object.extend("Subscription");
   var query = new Parse.Query(Subscription);
   var object = new Subscription();

   var clientId = getClientId(user);

   var objectToSave = {
      clientId: clientId,
      trialStart: trial_start,
      trialEnd: trial_end,
      subscriptionCreated: subscription_created,
      currentPeriodStart: current_period_start,
      currentPeriodEnd: current_period_end,
      interval: interval,
      subscriptionId: subscription_id
   };

   if (payment_intent === null) {
      objectToSave.paymentIntent = 'trial';
   } else {
      objectToSave.paymentIntent = 'paid';
   }

   query.equalTo("clientId",clientId);
   query.find()
      .then(function(res) {
         if (res.length !== 0) {
            object = res[0];
         }

         object.save(objectToSave)
            .then(function(res) {
               callback(null, res);
            })
            .catch(function(err) {
               callback(err, null);
            });  
      })
      .catch(function(err) {
         callback(err, null);
      });
};

exports.getLocationsForUser = function( user, callback ){
	var SubLocation = Parse.Object.extend("SubLocation");
	var query = new Parse.Query(SubLocation);	
   var clientId = getClientId(user);
	
	query.equalTo("clientId",clientId);
	query.limit(1000);
   query.ascending("name");
   query.find()
   .then(function(results){
      var locations_ob = {};
      var locations_arr = [];

      for (var i = 0; i < results.length; i++) {
         var object = results[i];
         
         var id              = object.id;
         var location        = object.get('location');
         var subLocationId   = object.get('name').toLowerCase();
         var subLocationName = object.get('displayName');
         
         if (locations_ob[ location ] === undefined){
            var loc = {
               id: location,
               name: location,
               subLocations: []
            };
            locations_ob[ location ] = loc;
            locations_arr.push( loc );
         }
         
         var subLocation_ob = {
            parseId: id,
            locationId: subLocationId,
            name: subLocationName
         };
         
         locations_ob[ location ].subLocations.push( subLocation_ob );
      }
      
      for( i = 0; i < locations_arr.length; i++ ){
         // make a shortened string
         loc = locations_arr[ i ];
         var arr = [];
         for(var j=0; j<loc.subLocations.length; j++){
            arr.push( loc.subLocations[ j ].parseId );
         }
         loc.subLocationsIdString = arr.join("~");
      }
      
      locations_arr.sort( function(a,b){
         var nameA = a.name.toUpperCase(); // ignore upper and lowercase
         var nameB = b.name.toUpperCase(); // ignore upper and lowercase
         if (nameA < nameB) {
            return -1;
         }
         if (nameA > nameB) {
            return 1;
         }

         // names must be equal
         return 0;
      });			

      callback( null, locations_arr );			
   }, function(error){
      callback( error, null );
   });
};

exports.getGuestBookFromId = function( guestbookId, callback) {
   var Guestbook = Parse.Object.extend('Guestbook');
   var query = new Parse.Query(Guestbook);

   query.equalTo('objectId', guestbookId);
   query.find()
   .then(function(res) {
      if (res.length === 0) {
         callback(null, null);
      } else {
         var object = res[0];
         var guestbookData = {
            clientId: object.get('clientId'),
            location: object.get('location'),
            introduction: object.get('introduction'),
            image: object.get('image')
         };

         if (object.get('image')) {
            var Image = Parse.Object.extend('Image');
            var query = new Parse.Query(Image);
   
            query.equalTo('objectId', object.get('image'));
            query.find()
            .then(function(res) {
               if (res.length === 0) {
                  guestbookData.image = undefined;
                  callback(null, guestbookData);
               } else {
                  var imageObject = res[0].get('iPhone3x');
                  
                  if (typeof(imageObject) === 'object') {
                     guestbookData.image = imageObject.url();
                  } else {
                     guestbookData.image = undefined;
                  }
                  callback(null, guestbookData);
               }
            })
            .catch(function(err) {
               callback(err, null);
            });
         } else {
            callback(null, guestbookData);
         }
      }
   })
   .catch(function(err) {
      callback(err, null);
   });
};

exports.getGuestBookForUser = function( user, location, callback ){
   var Guestbook = Parse.Object.extend("Guestbook");
   var query = new Parse.Query(Guestbook);   
   var clientId = getClientId(user);

   query.equalTo("clientId",clientId);
   query.equalTo("location", location);
   query.find()
   .then(function(results){         
      if (results.length === 0) {
         callback( null, null );
      } else {
         var object = results[0];
         var id = object.id;
         var image = object.get("image");
         var introduction = object.get("introduction");
         var guestBookData = {
            id: id,
            image: undefined,
            introduction: introduction
         };

         if (image) {
            var Image = Parse.Object.extend('Image');
            query = new Parse.Query(Image);

            query.equalTo('objectId', image);
            query.find()
            .then(function(res) {
               if (res.length === 0) {
                  callback(null, guestBookData);
               } else {
                  object = res[0];
                  var imageObject = object.get('iPhone3x');
                  
                  if (typeof(imageObject) === 'object') {
                     guestBookData.image = imageObject.url();
                  }

                  callback(null, guestBookData);
               }
            })
            .catch(function(err) {
               callback(err, null);
            });
         } else {
            callback( null, guestBookData );
         }
      }
   })
   .catch(function(error){
      callback( error, null );
   });
};

exports.saveGuestBookData = function( user, location, file, introduction, callback ){
   var Guestbook = Parse.Object.extend("Guestbook");
   var query = new Parse.Query(Guestbook);
   var clientId = getClientId(user);

   query.equalTo("clientId",clientId);
   query.equalTo("location", location);
   query.find()
   .then(function (results) {
      if (results.length === 0) {
         createGuestBook(null, clientId, location, file, introduction, callback);
      } else {
         var object = results[0];
         updateGuestBook(object, file, introduction, callback);
      }
   }, function (err) {
      callback( err, null );
   });
};

function createGuestBook(object, clientId, location, file, introduction, callback) {
   var objectToSave = {
      clientId: clientId,
      location: location,
      introduction: introduction
   };

   if (file === null) {
      reallySaveGuestbookToServer( object, objectToSave, callback );
   } else {
      getBase64(file)
      .then(function(base64) {
         var parseFile = new Parse.File("image.jpg", {base64});

         var Image = Parse.Object.extend('Image');
         var imageObject = new Image();
         var imageObjectToSave = {
            iPhone3x: parseFile,
            iPhone2x: parseFile,
            iPad2x: parseFile
         };

         imageObject.save(imageObjectToSave)
         .then(function(res) {
            objectToSave.image = res.id;
            reallySaveGuestbookToServer( object, objectToSave, callback );
         })
         .catch(function(err) {
            callback(err, null);
         });
      })
      .catch(function(err) {
         callback(err, null);
      });      
   }
}

function updateGuestBook(object, file, introduction, callback) {
   var objectToSave = {
      introduction: introduction
   };

   if (file === null) {
      reallySaveGuestbookToServer( object, objectToSave, callback );
   } else {
      getBase64(file)
      .then(function(base64) {
         var parseFile = new Parse.File("image.jpg", {base64});

         var Image = Parse.Object.extend('Image');

         if (object.get('image')) {
            var query = new Parse.Query(Image);

            query.equalTo('objectId', object.get('image'));
            query.find()
            .then(function(res) {
               var imageObject = res[0];
               var imageObjectToSave = {
                  iPhone3x: parseFile,
                  iPhone2x: parseFile,
                  iPad2x: parseFile
               };

               imageObject.save(imageObjectToSave)
               .then(function(res) {
                  objectToSave.image = res.id;
                  reallySaveGuestbookToServer( object, objectToSave, callback );
               })
               .catch(function(err) {
                  callback(err, null);
               });
            })
            .catch(function(err) {
               callback(err, null);
            });            
         } else {
            var imageObject = new Image();
            var imageObjectToSave = {
               iPhone3x: parseFile,
               iPhone2x: parseFile,
               iPad2x: parseFile
            };

            imageObject.save(imageObjectToSave)
            .then(function(res) {
               objectToSave.image = res.id;
               reallySaveGuestbookToServer( object, objectToSave, callback );
            })
            .catch(function(err) {
               callback(err, null);
            });
         }
      })
      .catch(function(err) {
         callback(err, null);
      });      
   }
}

function reallySaveGuestbookToServer( object, objectToSave, callback ) {
   if (object === null) {
      var Guestbook = Parse.Object.extend("Guestbook");
		object = new Guestbook();
   }

   object.save(objectToSave)
   .then(function(object){
      var guestbookId = object.id;
      var Image = Parse.Object.extend('Image');
      var query = new Parse.Query(Image);

      var guestbookData = {
         id: object.id,
         introduction: object.get('introduction')
      };

      query.equalTo('objectId', object.get('image'));
      query.find()
      .then(function(res) {
         if (res.length === 0) {
            guestbookData.image = undefined;
            callback(null, guestbookData);
         } else {
            object = res[0];

            var imageUrl = undefined;
            var imageObject = object.get('iPhone3x');
                        
            if (typeof(imageObject) === 'object') {
               imageUrl = imageObject.url();
            }
   
            guestbookData.image = imageUrl;
   
            callback(null, guestbookData);
         }

         reflectDataFormGuestbookToPage(guestbookId);
      })
      .catch(function(err) {
         callback(err, null);
      });
   })
   .catch(function(err) {
      callback(err, null);
   }); 
}

exports.getSectionData = function(guestbookId, callback) {
   var Guestbooksection = Parse.Object.extend("Guestbooksection");
   var query = new Parse.Query(Guestbooksection);
   query.equalTo('guestbookId', guestbookId);
   query.ascending('order');
   query.find()
   .then(function (results) {
      if (results.length === 0) {
         callback(null, null);   
      } else {
         var sectionData = [];
         for (var i = 0; i < results.length; i++) {
            var object = results[i];            
            var section = {
               id                 : object.id,
               order              : object.get('order'),
               guestbookId        : object.get('guestbookId'),
               sectionTitle       : object.get('sectionTitle'),
               image              : object.get('image'),
               sectionIntroduction: object.get('sectionIntroduction')                  
            };

            sectionData.push( section );
         }

         getSectionImage(sectionData, callback);
      }
   })
   .catch(function (err) {
      callback( err, null );
   });
};

function getSectionImage(sectionData, callback) {
   var Image = Parse.Object.extend('Image');
   var query = new Parse.Query(Image);
   var imageIdList = [];

   for (var i = 0; i < sectionData.length; i++) {
      if (sectionData[i].image) {
         imageIdList.push(sectionData[i].image);
      }
   }

   query.containedIn('objectId', imageIdList);
   query.find()
   .then(function(res) {
      for( i = 0; i < res.length; i++ ) {
         for ( var j = 0; j < sectionData.length; j++ ) {
            if (res[i].id === sectionData[j].image) {
               var imageURL = null;
               var imageObject = res[i].get('iPhone3x');
               if (typeof(imageObject) === 'object') {
                  imageURL = imageObject.url();
               }
               sectionData[j].image = imageURL;
            }
         }
      }
      callback(null, sectionData);
   })
   .catch(function(err) {
      callback(err, null);
   });
}

exports.addSection = function( order, guestbookId, sectionTitle, sectionIntroduction, callback ) {
   var Guestbooksection = Parse.Object.extend("Guestbooksection");
   var object = new Guestbooksection();
   var objectToSave = {
      guestbookId: guestbookId,
      sectionTitle: sectionTitle,
      sectionIntroduction: sectionIntroduction,
      order: order
   };

   object.save(objectToSave)
   .then( function(object){
      self.getSectionData(guestbookId, function( err, sectionData) {
         if (err) {
            callback(err, null);      
         } else {
            callback(null, sectionData);
         }
      });

      reflectDataFormGuestbookToPage(guestbookId);
   }, function(error) {
      callback(error, null);
   }); 
};

exports.updateSectionData = function(guestbookId, order, sectionTitle, file, introduction, callback) {
   var Guestbooksection = Parse.Object.extend("Guestbooksection");
   var query = new Parse.Query(Guestbooksection);

   query.equalTo("guestbookId", guestbookId);
   query.equalTo("order", order);
   query.find()
      .then(function (results) {
         var object = results[0];
         updateSectionData(object, sectionTitle, file, introduction, callback);
      }, function (err) {
			callback( err, null );
      });
};

function updateSectionData(object, sectionTitle, file, introduction, callback) {
   var objectToSave = {
      sectionTitle: sectionTitle,
      sectionIntroduction: introduction
   };

   if (file === null) {
      reallySaveSectionToServer( object, objectToSave, callback );
   } else if (file === 'isImageDeleted') {
      objectToSave.image = null;
      reallySaveSectionToServer( object, objectToSave, callback );
   } else {
      getBase64(file)
      .then(function(base64) {
         var parseFile = new Parse.File("image.jpg", {base64});

         var Image = Parse.Object.extend('Image');

         if (object.get('image')) {
            var query = new Parse.Query(Image);

            query.equalTo('objectId', object.get('image'));
            query.find()
            .then(function(res) {
               var imageObject = res[0];
               var imageObjectToSave = {
                  iPhone3x: parseFile,
                  iPhone2x: parseFile,
                  iPad2x  : parseFile
               };
   
               imageObject.save(imageObjectToSave)
               .then(function(res) {
                  objectToSave.image = res.id;
                  reallySaveSectionToServer( object, objectToSave, callback );
               })
               .catch(function(err) {
                  callback(err, null);
               });
            })
            .catch(function(err) {
               callback(err, null);
            });
         } else {
            var imageObject = new Image();
            var imageObjectToSave = {
               iPhone3x: parseFile,
               iPhone2x: parseFile,
               iPad2x  : parseFile
            };

            imageObject.save(imageObjectToSave)
            .then(function(res) {
               objectToSave.image = res.id;
               reallySaveSectionToServer( object, objectToSave, callback );
            })
            .catch(function(err) {
               callback(err, null);
            });
         }
      }, function(err) {
         callback(err, null);
      });      
   }
}

function reallySaveSectionToServer( object, objectToSave, callback ) {
   object.save(objectToSave)
   .then( function(res){
      var guestbookId = res.get('guestbookId');

      if (res.get('image')) {
         var Image = Parse.Object.extend('Image');
         var query = new Parse.Query(Image);

         query.equalTo('objectId', res.get('image'));
         query.find()
         .then(function(res) {
            var imageURL = null;
            var imageObject = res[0].get('iPhone3x');

            if (typeof(imageObject) === 'object') {
               imageURL = imageObject.url();
            }
            callback(null, imageURL);
         })
         .catch(function(err) {
            callback(err, null);
         });
      } else {
         callback(null, null);
      }

      reflectDataFormGuestbookToPage(guestbookId);
   })
   .catch(function(err) {
      callback(err, null);
   }); 
}

function reflectDataFormGuestbookToPage(guestbookId) {
   var guestbookData = null;
   var pageObject = null;
   var Guestbook = Parse.Object.extend('Guestbook');
   var query = new Parse.Query(Guestbook);

   query.equalTo('objectId', guestbookId);
   query.find()
   .then(function(res) {
      if (res.length !== 0) {
         guestbookData = res[0];

         var object = res[0];

         var Page = Parse.Object.extend('Page');
         var query = new Parse.Query(Page);

         query.equalTo('clientId', object.get('clientId'));
         query.endsWith('locationName', object.get('location'));
         query.equalTo('type', 'guestbook');
         query.find()
         .then(function(res) {
            if (res.length !== 0) {
               pageObject = res[0];

               var Guestbooksection = Parse.Object.extend('Guestbooksection');
               var query = new Parse.Query(Guestbooksection);

               query.equalTo('guestbookId', guestbookId);
               query.find()
               .then(function(res) {
                  var objectToSave = {
                     image: guestbookData.get('image'),
                     html: guestbookData.get('introduction'),
                  };
   
                  if (res.length !== 0) {
                     objectToSave.url = `http://parse.boluga.com:7070/view_guestbook/${guestbookId}`;
                  } else {
                     objectToSave.url = null;
                  }
                  
                  pageObject.save(objectToSave)
                  .then(function(res) {})
                  .catch(function(err) {
                     console.log('reflectDataFormGuestbookToPage', err);                     
                  });
               })
               .catch(function(err) {
                  console.log('reflectDataFormGuestbookToPage', err);
               });
            }
         })
         .catch(function(err) {
            console.log('reflectDataFormGuestbookToPage', err);
         });
      }
   })
   .catch(function(err) {
      console.log('reflectDataFormGuestbookToPage', err);
   });
}

exports.deleteSectionData = function (guestbookId, order, callback) {
   var Guestbooksection = Parse.Object.extend("Guestbooksection");
   var query = new Parse.Query(Guestbooksection);

   query.equalTo("guestbookId", guestbookId);
   query.equalTo("order", order);
   query.find()
   .then(function (results){
      var object = results[0];

      Parse.Object.destroyAll(object)
      .then(function(object){
         callback(null, "Success!");

         reflectDataFormGuestbookToPage(guestbookId);
      })
      .catch(function(err){
         callback(err, null);
      });         
   })
   .catch(function(err) {
      callback(err, null);
   });
};

exports.sectionReorder = function (sectionData, callback) {
   var Guestbooksection = Parse.Object.extend("Guestbooksection");
   var query = new Parse.Query(Guestbooksection);
   if (sectionData.length !== 0) {
      query.equalTo("guestbookId", sectionData[0].guestbookId);
      query.find()
         .then(function (results){
            for (var i = 0; i < results.length; i++) {
               var delObject = results[i];
               Parse.Object.destroyAll(delObject);   
            }
            
            for (i = 0; i < sectionData.length; i++) {
               var object = new Guestbooksection();
               var objectToSave = {
                  guestbookId: sectionData[i].guestbookId,
                  order: sectionData[i].order,
                  sectionTitle: sectionData[i].sectionTitle,
                  image: sectionData[i].image,               
                  sectionIntroduction: sectionData[i].sectionIntroduction               
               };
               object.save(objectToSave);
            }
            callback(null, "Success!");
         }, function(err) {
            callback(err, null);
         });      
   }
};

exports.getTagsForUser = function( user, callback ){
	
	var Tag = Parse.Object.extend("Tag");
	var query = new Parse.Query(Tag);
	
	var clientId = getClientId(user);

	query.equalTo("clientId",clientId);
	query.limit(1000);
	query.ascending("name");
   query.find()
      .then(function(results){
			var response = [];

         for (var i = 0; i < results.length; i++) {
				var object = results[i];
				var ob = {
					name: object.get('name')
				};
				response.push( ob );
			}
			callback( null, response );
		}, function(error){
			callback( error, null );
		});
};

exports.addMessage = function( user, payload, callback ) {
   var clientId = getClientId(user);
   var Story = Parse.Object.extend("Story");
   var object = new Story();

   var objectToSave = {
      client: clientId,
      title: payload.title,
      publishDate: payload.publishDate,
      expiryDate: payload.expiryDate,
      resorts: payload.resorts,
      tags: payload.tags,
      sharingEnabled: payload.sharingEnabled
   };
   if (payload.ytCode) {
      objectToSave['ytCode'] = payload.ytCode;   
   }
   if (payload.details) {
      objectToSave['details'] = payload.details;   
   }

   if (payload.pdfFile) {
      getBase64(payload.pdfFile)
         .then(function(base64) {
            var parseFile = new Parse.File("pdf.pdf", {base64});
            objectToSave['pdfFile'] = parseFile;

            if (payload.imageFile) {
               getBase64(payload.imageFile)
                  .then(function(base64) {                     
                     async.parallel({
                        iPhone4_5SImageFile: function( cb ){
                           getResizedImage(base64, 640, 1136, function(err, res) {
                              cb(err, res)
                           })
                        },
                        iPhone6ImageFile: function( cb ){
                           getResizedImage(base64, 750, 1334, function(err, res) {
                              cb(err, res)
                           })
                        },
                        iPhone6PlusImageFile: function( cb ){
                           getResizedImage(base64, 1242, 2208, function(err, res) {
                              cb(err, res)
                           })
                        },
                        iPadImageFile: function( cb ){
                           getResizedImage(base64, 1536, 2048, function(err, res) {
                              cb(err, res)
                           })
                        },
                        thumbnailImageFile: function( cb ){
                           getResizedImage(base64, 148, 148, function(err, res) {
                              cb(err, res)
                           })
                        },
                        thumbnailImageFileIPad: function( cb ){
                           getResizedImage(base64, 222, 222, function(err, res) {
                              cb(err, res)
                           })
                        },
                     }, function(err, results){
                        if (err){
                           callback(err, null);   
                        } else {
                           for( var key in results ){
                              var base64 = results[key]
                              var parseFile = new Parse.File("image.jpg", {base64});
                              objectToSave[key] = parseFile;
                           }
                           reallySaveMessage(object, objectToSave, callback);
                        }
                     });
                  }, function(err) {
                     callback(err, null);
                  });   
            } else {
               reallySaveMessage(object, objectToSave, callback);
            }
         }, function(err) {
            callback(err, null);
         });   
   } else {
      if (payload.imageFile) {
         getBase64(payload.imageFile)
            .then(function(base64) {
               async.parallel({
                  iPhone4_5SImageFile: function( cb ){
                     getResizedImage(base64, 640, 1136, function(err, res) {
                        cb(err, res)
                     })
                  },
                  iPhone6ImageFile: function( cb ){
                     getResizedImage(base64, 750, 1334, function(err, res) {
                        cb(err, res)
                     })
                  },
                  iPhone6PlusImageFile: function( cb ){
                     getResizedImage(base64, 1242, 2208, function(err, res) {
                        cb(err, res)
                     })
                  },
                  iPadImageFile: function( cb ){
                     getResizedImage(base64, 1536, 2048, function(err, res) {
                        cb(err, res)
                     })
                  },
                  thumbnailImageFile: function( cb ){
                     getResizedImage(base64, 148, 148, function(err, res) {
                        cb(err, res)
                     })
                  },
                  thumbnailImageFileIPad: function( cb ){
                     getResizedImage(base64, 222, 222, function(err, res) {
                        cb(err, res)
                     })
                  },
               }, function(err, results){
                  if (err){
                     callback(err, null);   
                  } else {
                     for( var key in results ){
                        var base64 = results[key]
                        var parseFile = new Parse.File("image.jpg", {base64});
                        objectToSave[key] = parseFile;
                     }
                     reallySaveMessage(object, objectToSave, callback);
                  }
               });
            }, function(err) {
               callback(err, null);
            });   
      } else {
         reallySaveMessage(object, objectToSave, callback);
      }
   }
};

function reallySaveMessage(object, objectToSave, callback) {
   object.save(objectToSave)
      .then( function(object){
         callback(null, "Success!");
      }, function(error) {
         callback(error, null);
      }); 
}

exports.updateMessage = function(id, payload, callback) {
   var Story = Parse.Object.extend("Story");
	var query = new Parse.Query(Story);
	
	query.equalTo("objectId", id);
   query.find()
      .then(function(res) {
         if (res.length === 0) {
            callback( null, null );
         } else {
            var object = res[0];
            var objectToSave = {
               title: payload.title,
               publishDate: payload.publishDate,
               expiryDate: payload.expiryDate,
               resorts: payload.resorts,
               tags: payload.tags,
               sharingEnabled: payload.sharingEnabled
            };
            if (payload.ytCode) {
               objectToSave['ytCode'] = payload.ytCode;   
            }
            if (payload.details) {
               objectToSave['details'] = payload.details;   
            }
         
            if (payload.pdfFile) {
               getBase64(payload.pdfFile)
                  .then(function(base64) {
                     var parseFile = new Parse.File("pdf.pdf", {base64});
                     objectToSave['pdfFile'] = parseFile;
         
                     if (payload.imageFile) {
                        getBase64(payload.imageFile)
                           .then(function(base64) {                     
                              async.parallel({
                                 iPhone4_5SImageFile: function( cb ){
                                    getResizedImage(base64, 640, 1136, function(err, res) {
                                       cb(err, res)
                                    })
                                 },
                                 iPhone6ImageFile: function( cb ){
                                    getResizedImage(base64, 750, 1334, function(err, res) {
                                       cb(err, res)
                                    })
                                 },
                                 iPhone6PlusImageFile: function( cb ){
                                    getResizedImage(base64, 1242, 2208, function(err, res) {
                                       cb(err, res)
                                    })
                                 },
                                 iPadImageFile: function( cb ){
                                    getResizedImage(base64, 1536, 2048, function(err, res) {
                                       cb(err, res)
                                    })
                                 },
                                 thumbnailImageFile: function( cb ){
                                    getResizedImage(base64, 148, 148, function(err, res) {
                                       cb(err, res)
                                    })
                                 },
                                 thumbnailImageFileIPad: function( cb ){
                                    getResizedImage(base64, 222, 222, function(err, res) {
                                       cb(err, res)
                                    })
                                 },
                              }, function(err, results){
                                 if (err){
                                    callback(err, null);   
                                 } else {
                                    for( var key in results ){
                                       var base64 = results[key]
                                       var parseFile = new Parse.File("image.jpg", {base64});
                                       objectToSave[key] = parseFile;
                                    }
                                    reallySaveMessage(object, objectToSave, callback);
                                 }
                              });
                           }, function(err) {
                              callback(err, null);
                           });   
                     } else {
                        reallySaveMessage(object, objectToSave, callback);
                     }
                  }, function(err) {
                     callback(err, null);
                  });   
            } else {
               if (payload.imageFile) {
                  getBase64(payload.imageFile)
                     .then(function(base64) {
                        async.parallel({
                           iPhone4_5SImageFile: function( cb ){
                              getResizedImage(base64, 640, 1136, function(err, res) {
                                 cb(err, res)
                              })
                           },
                           iPhone6ImageFile: function( cb ){
                              getResizedImage(base64, 750, 1334, function(err, res) {
                                 cb(err, res)
                              })
                           },
                           iPhone6PlusImageFile: function( cb ){
                              getResizedImage(base64, 1242, 2208, function(err, res) {
                                 cb(err, res)
                              })
                           },
                           iPadImageFile: function( cb ){
                              getResizedImage(base64, 1536, 2048, function(err, res) {
                                 cb(err, res)
                              })
                           },
                           thumbnailImageFile: function( cb ){
                              getResizedImage(base64, 148, 148, function(err, res) {
                                 cb(err, res)
                              })
                           },
                           thumbnailImageFileIPad: function( cb ){
                              getResizedImage(base64, 222, 222, function(err, res) {
                                 cb(err, res)
                              })
                           },
                        }, function(err, results){
                           if (err){
                              callback(err, null);   
                           } else {
                              for( var key in results ){
                                 var base64 = results[key]
                                 var parseFile = new Parse.File("image.jpg", {base64});
                                 objectToSave[key] = parseFile;
                              }
                              reallySaveMessage(object, objectToSave, callback);
                           }
                        });
                     }, function(err) {
                        callback(err, null);
                     });   
               } else {
                  reallySaveMessage(object, objectToSave, callback);
               }
            }
         }
      })
      .catch(function(err) {
         callback( err, null );
      })   
};

exports.deleteMessage = function(id, callback) {
   var Story = Parse.Object.extend("Story");
	var query = new Parse.Query(Story);
	
	query.equalTo("objectId", id);
   query.find()
      .then(function(res) {
         if (res.length === 0) {
            callback( null, null );
         } else {
            var object = res[0];
            Parse.Object.destroyAll(object)
               .then(function(object){
                  callback(null, "Success!");
               }, function(err){
                  callback(err, null);
               });     
         }
      })
      .catch(function(err) {
         callback( err, null );
      })   
};

exports.getMessages = function( user, resorts, callback ) {
   var Story = Parse.Object.extend("Story");
   var query = new Parse.Query(Story);
   
   var clientId = getClientId(user);
   query.equalTo("client",clientId);
   query.limit(1000);
   query.descending("publishDate");

   query.containedIn( "resorts", resorts );
   query.find()
      .then(function(res) {
         if (res.length === 0) {
            callback(null, []);   
         } else {
            var messages = [];
            for (var i = 0; i < res.length; i++) {
               var object = res[i];
               var imageUrl = "";
               var imageObject = object.get('thumbnailImageFile');
               if (typeof(imageObject) === 'object') {
                  imageUrl = imageObject.url();
               }
               var msg = {
                  id: object.id,
                  image: imageUrl,
                  title: object.get('title'),
               };
               messages.push( msg );
            }
            callback(null, messages);   
         }
      })
      .catch(function(err) {
         callback(err, null);
      })
};

exports.getMessageWithId = function(user, id, callback) {
   var Story = Parse.Object.extend("Story");
	var query = new Parse.Query(Story);
	
   var clientId = getClientId(user);
   query.equalTo("client", clientId);
   query.equalTo("objectId", id);
   query.find()
      .then(function(res) {
         var object = res[0];
         var imageUrl = "";
         var imageObject = object.get('thumbnailImageFile');
         if (typeof(imageObject) === 'object') {
            imageUrl = imageObject.url();
         }
         var msg = {
            id: object.id,
            image: imageUrl,
            title: object.get('title'),
            ytCode: object.get('ytCode'),
            details: object.get('details'),
            publishDate: object.get('publishDate'),
            expiryDate: object.get('expiryDate'),
            tags: object.get('tags'),
            resorts: object.get('resorts'),
            sharingEnabled: object.get('sharingEnabled')            
         };
         callback(null, msg);   
      })
      .catch(function(err) {
         callback(err, null);
      })
};

exports.saveLogoImage = function(user, fileKind, file, callback) {
   var clientId = getClientId(user);
   var objectToSave = {};

   getBase64(file)
      .then(function(base64) {
         var parseFile = new Parse.File("image.jpg", {base64});
         // if (fileKind === "logo") {
         //    objectToSave['logo'] = parseFile;   
         // } else {
         //    objectToSave['logoSmall'] = parseFile;
         // }

         objectToSave['iPhone3x'] = parseFile;
         objectToSave['iPhone2x'] = parseFile;
         objectToSave['iPad2x'] = parseFile;
         objectToSave['clientId'] = clientId;

         var Style = Parse.Object.extend("Style");         
         var query = new Parse.Query(Style);

         query.equalTo("clientId", clientId);
         query.find()
            .then(function(res) {
               if (res.length === 0) {
                  reallySaveLogoImage(null, objectToSave, fileKind, callback);
               } else {
                  var object = res[0];
                  reallySaveLogoImage(object, objectToSave, fileKind, callback);
               }
            })
            .catch(function(err) {
               callback(err, null);
            })
      }, function(err) {
         callback(err, null);
      });  
};

function reallySaveLogoImage(object, objectToSave, fileKind, callback) {

   if (object === null) {                                            // if object is null on style class
      var Style = Parse.Object.extend("Style");         
      object = new Style();
      
      var Image = Parse.Object.extend("Image");
      var imageObject = new Image();
      imageObject.save(objectToSave)
         .then(function(res) {
            if (fileKind === 'logo') {
               var imageObjectToSave = { logo: res.id };
            } else {
               imageObjectToSave = { logoSmall: res.id };
            }
            imageObjectToSave['clientId'] = objectToSave.clientId;
            object.save(imageObjectToSave)
               .then(function(res) {
                  callback(null, "Success!");
               })
               .catch(function(err) {
                  callback(err, null)
               })
         })
         .catch(function(err) {
            callback(err, null);
         })
   } else {                                                            // if object is not null on style class
      Image = Parse.Object.extend("Image");         
      var query = new Parse.Query(Image);
      var id = '';

      if (fileKind === "logo") {
         id = object.get('logo');
      } else {
         id = object.get('logoSmall');
      }

      if (id === undefined) {                                          //object exist but logo or logosmall image is not exist
         imageObject = new Image();
         imageObject.save(objectToSave)
         .then(function(res) {
            if (fileKind === 'logo') {
               var imageObjectToSave = {
                  logo: res.id
               }
            } else {
               imageObjectToSave = {
                  logoSmall: res.id
               }
            }
            object.save(imageObjectToSave)
               .then(function(res) {
                  callback(null, "Success!");
               })
               .catch(function(err) {
                  callback(err, null)
               })
         })
         .catch(function(err) {
            callback(err, null);
         })    
      } else {                                                         // object exist and also logo or logosmall image exist
         query.equalTo("objectId", id);
         query.find()
         .then(function(res) {
            if (res.length === 0) {                                     // id of image class exist but object on image class is not exist
               var imageObject = new Image();

               imageObject.save(objectToSave)
                  .then(function(res) {
                     if (fileKind === 'logo') {
                        var imageObjectToSave = {
                           logo: res.id
                        }
                     } else {
                        imageObjectToSave = {
                           logoSmall: res.id
                        }
                     }
                     object.save(imageObjectToSave)
                        .then(function(res) {
                           callback(null, "Success!");
                        })
                        .catch(function(err) {
                           callback(err, null)
                        })
                  })
                  .catch(function(err) {
                     callback(err, null)
                  })
            } else {
               imageObject = res[0];

               imageObject.save(objectToSave)
               .then(function(res) {
                  callback(null, "Success!");
               })
               .catch(function(err) {
                  callback(err, null);
               })            
            }            
         })
         .catch(function(err) {
            callback(err, null);
         })         
      }
   }
};

exports.saveStyle = function(user, payload, callback) {
   var Style = Parse.Object.extend("Style");
   var query = new Parse.Query(Style);
   var clientId = getClientId(user);
   var objectToSave = {
      deepNavColour: payload.deepNavColour,
      shallowNavColour: payload.shallowNavColour,
      iconColour: payload.iconColour,
      iconLiveColour: payload.iconLiveColour,
      textColour: payload.textColour,
      bottomBarColour: payload.bottomBarColour,
      storyBackgroundColour: payload.storyBackgroundColour,
      contentBackgroundColour: payload.contentBackgroundColour,
      tagsTextColour: payload.tagsTextColour,
      clientId: clientId
   };

   query.equalTo("clientId", clientId);
   query.find()
      .then(function(res) {
         if (res.length === 0) {
            reallySaveStyle(null, objectToSave, callback);
         } else {
            var object = res[0];
            reallySaveStyle(object, objectToSave, callback);
         }
      })
      .catch(function(err) {
         callback(err, null);
      })
};

function reallySaveStyle(object, objectToSave, callback) {
   if (object === null) {
      var Style = Parse.Object.extend("Style");
      object = new Style();
   }

   object.save(objectToSave)
      .then(function(res) {
         callback(null, "Success!")
      })
      .catch(function(err) {
         callback(err, null);
      })
};

exports.getStyle = function(user, callback) {
   var Style = Parse.Object.extend("Style");
   var query = new Parse.Query(Style);
   var clientId = getClientId(user);

   query.equalTo("clientId", clientId);
   query.find()
      .then(function(res) {
         if (res.length === 0) {
            callback(null, null);
         } else {
            var object = res[0];
            var styles = {
               id: object.id,
               deepNavColour: object.get('deepNavColour'),
               shallowNavColour: object.get('shallowNavColour'),
               iconColour: object.get('iconColour'),
               iconLiveColour: object.get('iconLiveColour'),
               textColour: object.get('textColour'),
               bottomBarColour: object.get('bottomBarColour'),
               storyBackgroundColour: object.get('storyBackgroundColour'),
               contentBackgroundColour: object.get('contentBackgroundColour'),
               tagsTextColour: object.get('tagsTextColour')
            }
            var Image = Parse.Object.extend("Image");
            query = new Parse.Query(Image);

            query.equalTo("clientId", clientId);
            query.find()
               .then(function(res) {
                  var logoImageUrl = "";
                  var logoSmallImageUrl = "";
                  for (var i = 0; i < res.length; i++) {                     
                     var imageObject = res[i].get('iPhone3x');

                     if (res[i].id === object.get('logo')) {                        
                        logoImageUrl = typeof(imageObject) === 'object' ? imageObject.url() : "";
                     } else if (res[i].id === object.get('logoSmall')) {
                        logoSmallImageUrl = typeof(imageObject) === 'object' ? imageObject.url() : "";
                     }
                  }
                  styles['logo'] = logoImageUrl;
                  styles['logoSmall'] = logoSmallImageUrl;

                  callback(null, styles);            
               })
               .catch(function(err) {
                  callback(err, null);
               })
         }
      })
      .catch(function(err) {
         callback(err, null);
      })
};

exports.getTabs = function(user, location, callback) {
   var Page = Parse.Object.extend('Page');
   var query = new Parse.Query(Page);
   var clientId = getClientId(user);
   let tabs = [];

   query.equalTo("clientId", clientId);
   query.contains("locationName", location);
   query.ascending("order");
   query.find()
      .then(function(res) {
         if (res.length !== 0) {
            for (var i = 0; i < res.length; i++) {
               var object = res[i];
               let data = {
                  id: object.id,
                  type: object.get('type'),
                  order: object.get('order'),
                  telephone: object.get('telephone'),
                  iconText: object.get('iconText'),
                  clientId: object.get('clientId'),
                  url: object.get('url'),
                  icon: object.get('icon'),
                  image: object.get('image')
               }
               tabs.push(data);
            }

            callback(null, tabs);
         } else {
            callback(null, []);
         }
      })
      .catch(function(err) {
         callback(err, null);
      })
};

exports.getIcons = function(callback) {
   var Image = Parse.Object.extend("Image");
   var query = new Parse.Query(Image);

   query.equalTo('type', 'tab_icon');
   query.ascending('createdAt');
   query.find()
      .then(function(res) {
         if (res.length !== 0) {
            var icons = [];
            for(var i = 0; i < res.length; i++) {
               var object = res[i];
               var imageURL = '';
               var imageObject = object.get('iPhone3x');
               if (typeof(imageObject) === 'object') {
                  imageURL = imageObject.url();
               }
               var icon = {
                  id: object.id,
                  iconName: object.get('description'),
                  iconFile: imageURL
               }
               icons.push(icon);
            }
            callback(null, icons);
         } else {
            callback(null, []);
         }
      })
      .catch(function(err) {
         callback(err, null);
      })
};

exports.addTab = function(user, tabData, callback) {
   var Page = Parse.Object.extend("Page");
   var object = new Page();
   var clientId = getClientId(user);

   var objectToSave = {
      locationName: `${clientId} ${tabData.location}`,
      type: tabData.type,
      iconText: tabData.icon,
      icon: tabData.icon,
      clientId: clientId,
      order: tabData.order,
      isMessages: tabData.isMessages
   }

   if (tabData.icon === 'gallery') {
      objectToSave.iconText = 'Image';
   }

   object.save(objectToSave)
      .then(function(res) {
         self.getTabs(user, tabData.location, callback);

         if (tabData.type === 'guestbook') {
            var location = res.get('locationName');
            if (location.includes('ClientId')) {
               location = location.split('ClientId ')[1];
            }

            var Guestbook = Parse.Object.extend('Guestbook');
            var query = new Parse.Query(Guestbook);

            query.equalTo('clientId', res.get('clientId'));
            query.equalTo('location', location);
            query.find()
            .then(function(res) {
               if (res.length !== 0) {
                  var guestbookId = res[0].id;
                  reflectDataFormGuestbookToPage(guestbookId);
               }
            })
            .catch(function(err) {
               console.log('addTab function', err);
            })
         }
      })
      .catch(function(err) {
         callback(err, null);
      })
};

exports.deleteTabData = function(user, location, order, id, callback) {
   var Page = Parse.Object.extend("Page");
   var query = new Parse.Query(Page);
   var clientId = getClientId(user);

   query.equalTo("clientId", clientId);
   query.contains("locationName", location);
   query.ascending("order");
   query.find()
      .then(function(res) {
         for(var i = 0; i < res.length; i++) {
            var object = res[i];
            if (object.id === id) {
               object.destroy()
                  .then(function(res){
                     self.getTabs(user, location, callback);
                  })
                  .catch(function(err){
                     callback(err, null);
                  });
            } else if (object.get('order') > order) {
               var objectToSave = {
                  order: object.get('order') - 1
               };
               object.save(objectToSave);
            }
         }
      })
      .catch(function(err) {
         callback(err, null);
      })
};

exports.saveTabIcon = function(id, icon, callback) {
   var Page = Parse.Object.extend('Page');
   var query = new Parse.Query(Page);

   query.equalTo('objectId', id);
   query.find()
      .then(function(res) {
         var object = res[0];
         var objectToSave = {
            icon: icon.iconName
         }

         object.save(objectToSave)
            .then(function(res) {
               callback(null, 'Success!');
            })
            .catch(function(err) {
               callback(err, null);
            })
      })
      .catch(function(err) {
         callback(err, null);
      })
};

exports.updateTabInfo = function(id, field, value, callback) {
   var Page = Parse.Object.extend('Page');
   var query = new Parse.Query(Page);

   query.equalTo('objectId', id);
   query.find()
      .then(function(res) {
         var object = res[0];
         var objectToSave = {};

         if (field === "telephone") {
            objectToSave['telephone'] = value;
         } else if (field === "url") {
            objectToSave['url'] = value;
         } else {
            objectToSave['iconText'] = value;
         }

         object.save(objectToSave)
            .then(function(res) {
               callback(null, 'Success!');
            })
            .catch(function(err) {
               callback(err, null);
            })
      })
      .catch(function(err) {
         callback(err, null);
      })
};

exports.tabImageUpload = function(user, location, id, imageId, imageFile, callback) {
   var clientId = getClientId(user);

   getBase64(imageFile)
      .then(function(base64) {
         var parseFile = new Parse.File("image.jpg", {base64});
         var objectToSave = {
            iPhone3x: parseFile,
            iPhone2x: parseFile,
            iPad2x: parseFile,
            clientId: clientId
         };

         if (imageId && imageId !== 'FTmo4RrfKc') {        // in case the current image is not default image
            var Image = Parse.Object.extend("Image");         
            var query = new Parse.Query(Image);   

            query.equalTo('objectId', imageId)
            query.find()
               .then(function(res) {
                  var object = res[0];                  

                  object.save(objectToSave)
                     .then(function(res) {
                        self.getTabs(user, location, callback)
                     })
                     .catch(function(err) {
                        callback(err, null);
                     })
               })
               .catch(function(err) {
                  callback(err, null);
               })
         } else {
            Image = Parse.Object.extend("Image");
            var object = new Image();
            
            object.save(objectToSave)
               .then(function(res) {
                  var imageTabId = res.id;
                  var Page = Parse.Object.extend('Page');
                  query = new Parse.Query(Page); 

                  query.equalTo('objectId', id);
                  query.find()
                     .then(function(res) {
                        object = res[0];
                        objectToSave = {
                           image: imageTabId
                        };

                        object.save(objectToSave)
                           .then(function(res) {
                              self.getTabs(user, location, callback);
                           })
                           .catch(function(err) {
                              callback(err, null);
                           })
                     })
                     .catch(function(err) {
                        callback(err, null);
                     })
               })
               .catch(function(err) {
                  callback(err, null);
               })
         }
      }, function(err) {
         callback(err, null);
      });  
}

exports.getTabImage = function(id, callback) {
   var Image = Parse.Object.extend('Image');
   var query = new Parse.Query(Image);

   query.equalTo('objectId', id);
   query.find()
      .then(function(res) {
         var object = res[0];
         var imageUrl = null;
         var imgObject = object.get('iPhone3x');

         if (typeof(imgObject) === 'object') {
            imageUrl = imgObject.url();
         }

         callback(null, imageUrl);
      })
      .catch(function(err) {
         callback(err, null);
      })
}

exports.tabReorder = function(user, location, tabData, callback) {
   var Page = Parse.Object.extend("Page");
   var query = new Parse.Query(Page);

   var clientId = getClientId(user);
   query.equalTo("clientId", clientId);
   query.contains("locationName", location);
   query.find()
      .then(function(res) {
         for (var i = 0; i < res.length; i++) {
            for (var j = 0; j < tabData.length; j++) {
               if (res[i].id === tabData[j].id) {
                  var objectToSave = {
                     order: tabData[j].order
                  };
                  res[i].save(objectToSave);
               }
            }
         }
         callback(null, 'Success!');
      })
      .catch(function(err) {
      })
};

function getStatisticesAppData(user, statisticType, deviceType, startDate, endDate, callback) {
   Parse.Cloud.useMasterKey();
   var query = new Parse.Query(Parse.Installation);

   var clientId = [getClientId(user)];

   query.greaterThanOrEqualTo(statisticType, startDate);
   query.lessThanOrEqualTo(statisticType, endDate);
   query.equalTo('deviceType', deviceType);

   if (deviceType === 'ios') {
      query.equalTo('appName', 'PocketConcierge');
   } else {
      query.equalTo('appName', 'Pocket Concierge');
   }
   
   query.containedIn('channels', clientId);
   query.count()
      .then(function(res) {
         callback(null, res);
      })
      .catch(function(err) {
         callback(err, null);
      })
}

function getStatisticesUserData(user, statisticType, deviceType, startDate, endDate, callback) {
   Parse.Cloud.useMasterKey();
   var query = new Parse.Query(Parse.Installation);

   var clientId = [getClientId(user)];

   query.greaterThanOrEqualTo(statisticType, startDate);
   query.lessThanOrEqualTo(statisticType, endDate);
   query.equalTo('deviceType', deviceType);

   if (deviceType === 'ios') {
      query.equalTo('appName', 'PocketConcierge');
   } else {
      query.equalTo('appName', 'Pocket Concierge');
   }

   query.containedIn('channels', clientId);
   query.count()
      .then(function(res) {
         callback(null, res);
      })
      .catch(function(err) {
         callback(err, null);
      })
}

exports.getStatistics = function(user, startDate, endDate, callback) {

   async.parallel({
      iosApp: function( cb ){
         getStatisticesAppData(user, 'createdAt', 'ios', startDate, endDate, function(err, res) {
            cb(err, res)
         })
      },
      androidApp: function( cb ){
         getStatisticesAppData(user, 'createdAt', 'android', startDate, endDate, function(err, res) {
            cb(err, res)
         })
      },
      iosUser: function( cb ){
         getStatisticesUserData(user, 'updatedAt', 'ios', startDate, endDate, function(err, res) {
            cb(err, res)
         })
      },
      androidUser: function( cb ){
         getStatisticesUserData(user, 'updatedAt', 'android', startDate, endDate, function(err, res) {
            cb(err, res)
         })
      }
   }, function(err, results){
      if (err){
         callback(err, null);   
      } else {
         callback(null, results)
      }
   });
};

exports.getDefaultTabIcon = function(defaultTabList, callback) {
   var Image = Parse.Object.extend('Image');
   var query = new Parse.Query(Image);

   query.equalTo('type', 'tab_icon');
   query.containedIn('description', defaultTabList);
   query.find()
   .then(function(results) {
      var iconList = {};

      for (var i = 0; i < results.length; i++) {
         iconList[results[i].get('description')] = results[i].id;
      }

      callback(null, iconList);
   })
   .catch(function(err) {
      callback(err, null);
   });
}

exports.addNewUser = function(hotelName, websiteUrl, phoneNumber, email, password, iconList, callback) {
   var User = Parse.Object.extend("User");
   var object = new User();
   var newToken = null;
   var newClientName = null;

   var objectToSave = {
      clientName: hotelName,
      username: email,
      email: email,
      password: password,
      showMessages: true
   }

   // Add New User
   object.save(objectToSave)
      .then(function(res) {

         // Get token and clientName from New User
         self.getTokenForUsernamePassword(email, password, function(err, token, clientName) {
            newToken = token;
            newClientName = clientName;

            // Get user object from token of New User (to get clientId)
            self.createUserFromToken(token, function(err, user) {
               var clientId = getClientId(user);

               var Client = Parse.Object.extend("Client");
               var object = new Client();

               objectToSave = {
                  clientId: clientId,
                  name: hotelName,
                  searchTerms: [hotelName]
               }

               // Add New Client
               object.save(objectToSave)
                  .then(function(res) {

                     // create default tab (Home, Messages, Call, Website)
                     async.parallel({
                        homeTab: function( cb ){
                           var homeObjectToSave = {
                              locationName: `${clientId} Primary location`,
                              clientId: clientId,
                              type: 'image',
                              iconText: 'Home',
                              order: 1,
                              icon: 'home',
                              image: 'FTmo4RrfKc' // default image of Image or Home tab when new client sign up
                           };
                           createDefaultTab(homeObjectToSave, function(err, res) {
                              cb(err, res)
                           })
                        },
                        messageTab: function( cb ){
                           var messageObjectToSave = {
                              locationName: `${clientId} Primary location`,
                              clientId: clientId,
                              type: 'messages',
                              iconText: 'Messages',
                              order: 2,
                              icon: 'messages',
                              isMessages: true
                           };
                           createDefaultTab(messageObjectToSave, function(err, res) {
                              cb(err, res)
                           })
                        },
                        callTab: function( cb ){
                           var callObjectToSave = {
                              locationName: `${clientId} Primary location`,
                              clientId: clientId,
                              type: 'call',
                              telephone: phoneNumber,
                              iconText: 'Call',
                              order: 3,
                              icon: 'call'
                           };
                           createDefaultTab(callObjectToSave, function(err, res) {
                              cb(err, res)
                           })
                        },
                        websiteTab: function( cb ){
                           var websiteObjectToSave = {
                              locationName: `${clientId} Primary location`,
                              clientId: clientId,
                              type: 'web',
                              url: websiteUrl,
                              iconText: 'Website',
                              order: 4,
                              icon: 'web'
                           };
                           createDefaultTab(websiteObjectToSave, function(err, res) {
                              cb(err, res)
                           })
                        }
                     }, function (err, results) {
                        if (err){
                           callback(err, null);   
                        } else {

                           // create default style
                           var Style = Parse.Object.extend("Style");
                           object = new Style();

                           objectToSave = {
                              clientId: clientId,
                              deepNavColour: '#ffffff7f',
                              iconColour: '#c7c7c7',
                              storyBackgroundColour: '#333333',
                              iconLiveColour: '#fAfAfA',
                              tagsTextColour: '#333333',
                              contentBackgroundColour: '#4c4c4c',
                              bottomBarColour: '#333333',
                              textColour: '#ffffff',
                              shallowNavColour: '#ffffff7f'
                           }

                           object.save(objectToSave)
                              .then(function(res) {

                                 // create Location
                                 var Location = Parse.Object.extend("Location");
                                 object = new Location();
            
                                 objectToSave = {
                                    clientId: clientId,
                                    name: `${clientId} Primary location`,
                                    displayName: 'Primary location',
                                    endPoint: true
                                 }
            
                                 object.save(objectToSave)
                                    .then(function(res) {
            
                                       // create SubLocation
                                       var SubLocation = Parse.Object.extend("SubLocation");
                                       object = new SubLocation();
                  
                                       objectToSave = {
                                          clientId: clientId,
                                          name: `${clientId} Primary location`,
                                          displayName: 'Primary location',
                                          location: 'Primary location'
                                       }
                  
                                       object.save(objectToSave)
                                          .then(function(res) {            
                                             callback(null, newToken, newClientName);
                                          })
                                          .catch(function(err) {
                                             callback(err, null);
                                          })
                                    })
                                    .catch(function(err) {
                                       callback(err, null);
                                    })
                              })
                              .catch(function(err) {
                                 callback(err, null);
                              })
                        }
                     })
                  })
                  .catch(function(err) {
                     callback(err, null);
                  })


            })
         })
      })
      .catch(function(err) {
         callback(err, null);
      })
}

function createDefaultTab(objectToSave, callback) {
   var Page = Parse.Object.extend("Page");
   var object = new Page();

   object.save(objectToSave)
      .then(function(res) {
         callback(null, null)
      })
      .catch(function(err) {
         callback(err, null);
      })
}

// --- Old function --- //
// exports.getClientLogoForUser = function( user ){

// 	var clientId = user.get('clientName').split(" ").join("").toLowerCase();
	
// 	return "/images/logos/"+clientId+".png";
// };

// exports.getMessagesForUser = function( user, subLocationIds, callback )
// {
// 	var Story = Parse.Object.extend("Story");
// 	var query = new Parse.Query(Story);
	
// 	var clientId = getClientId(user);
	
// 	query.equalTo("client",clientId);
// 	query.limit(1000);
// 	query.descending("publishDate");
// 	if (subLocationIds && subLocationIds.length > 0){
// 		query.containedIn( "resorts", subLocationIds );
// 	}
// 	query.find({
// 		success: function(results){
// 			console.log("got "+results.length+" story for "+clientId);
// 			var messages = [];
// 			for (var i = 0; i < results.length; i++) {
// 				var object = results[i];
// 				//console.log(object.id + ' - ' + object.get('client') + ' - ' + object.get('title') + ' - ' + object.get('publishDate') ) // + " - " + object.get('details'))
				
// 				var expiry = object.get('expiryDate');
// 				var publish = object.get('publishDate');
				
// 				var publishDateStr = moment( publish ).format("YYYY-MM-DD");
// 				var expiryDateStr  = moment( expiry ).format("YYYY-MM-DD");
// 				var publishDateDisplay = moment( publish ).format("ddd D MMM YYYY");
// 				var expiryDateDisplay  = moment( expiry ).format("ddd D MMM YYYY");
// 				var imageUrl = "";
// 				var imgObject = object.get('thumbnailImageFile');
// 				if (typeof(imageObject) === 'object') {
// 					imageUrl = imgObject.url();
// 				}
				
// 				var isArchive = moment( expiry ).isBefore( new Date() ) // work out if the date is in the past or the future!
				
// 				var msg = {
// 					id: object.id,
// 					thumbnail: imageUrl,
// 					title: object.get('title'),
// 					details: object.get('details'),
// 					publishDate: publishDateStr,
// 					expiryDate: expiryDateStr,
// 					publishDateDisplay: publishDateDisplay,
// 					expiryDateDisplay: expiryDateDisplay,
// 					archive: isArchive
// 				};
// 				messages.push( msg );
// 			}
			
// 			callback(null, messages);
// 		},
// 		error: function(error){
// 			console.log("got an error:",error);
// 			callback( error, null );
// 		}
// 	});
// };

// exports.getMessageWithIdForUser = function( user, msg_id, callback )
// {
// 	var Story = Parse.Object.extend("Story");
// 	var query = new Parse.Query(Story);
	
// 	var clientId = getClientId(user);
	
// 	query.equalTo("client",clientId);
// 	query.equalTo("objectId", msg_id);
// 	query.find({
// 		success: function(results){
// 			//console.log("got "+results.length+" story with objectId '"+msg_id+"'")
// 			var messages = [];
// 			for (var i = 0; i < results.length; i++) {
// 				var object = results[i];
// 				//console.log(object.id + ' - ' + object.get('client') + ' - ' + object.get('title') + ' - ' + object.get('publishDate') ) // + " - " + object.get('details'))
				
// 				var publishDateStr = moment( object.get('publishDate') ).format("YYYY-MM-DD");
// 				var expiryDateStr  = moment( object.get('expiryDate') ).format("YYYY-MM-DD");
// 				var publishDateDisplay = moment( object.get('publishDate') ).format("ddd D MMM YYYY");
// 				var expiryDateDisplay  = moment( object.get('expiryDate') ).format("ddd D MMM YYYY");
// 				var imageUrl = "";
// 				var imgObject = object.get('thumbnailImageFile');
// 				if (typeof(imageObject) === 'object') {
// 					imageUrl = imgObject.url();
// 				}
// 				var isArchive = moment( object.get('expiryDate') ).isBefore( new Date() ) // work out if the date is in the past or the future!
// 				//console.log(object.get('expiryDate') + " >>" + isActive)
				
// 				var pdfUrl = "";
// 				var pdfObject = object.get("pdfFile");
// 				if (typeof(imageObject) === 'object') {
// 					pdfUrl = pdfObject.url();
// 				}

// 				//var youtube = ""
// 				var youtube = object.get("ytCode");

// 				var msg = {
// 					id: object.id,
// 					thumbnail: imageUrl,
// 					pdf: pdfUrl,
// 					youtube: youtube,
// 					title: object.get('title'),
// 					details: object.get('details'),
// 					publishDate: publishDateStr,
// 					expiryDate: expiryDateStr,
// 					publishDateDisplay: publishDateDisplay,
// 					expiryDateDisplay: expiryDateDisplay,
// 					locations: object.get('resorts'),
// 					sharingEnabled: object.get('sharingEnabled'),
// 					archive: isArchive,
// 					tags: object.get('tags')
// 				};
// 				messages.push( msg );
// 			}
			
// 			if (messages.length > 0){
// 				callback(null, messages[0]);
// 			} else {
// 				var err = new Error("Message not found");
// 				callback(err, null);
// 			}
// 		},
// 		error: function(error){
// 			console.log("got an error:",error);
// 			callback( error, null );
// 		}
// 	});
// };

// exports.deleteMessageWithIdForUser = function( user, msg_id, callback )
// {

// 	var Story = Parse.Object.extend("Story");
// 	var query = new Parse.Query(Story);
	
// 	var clientId = getClientId(user);
	
// 	query.equalTo("client",clientId);
// 	query.equalTo("objectId", msg_id);
// 	query.find({
// 		success: function(results){
// 			//console.log("got "+results.length+" story with objectId '"+msg_id+"'")
// 			if (results.length > 0){
// 				var object = results[0];
				
// 				object.destroy({
// 				success: function(myObject) {
// 					// The object was deleted from the Parse Cloud.
// 					callback(null, null);
// 				},
// 				error: function(myObject, error) {
// 					// The delete failed.
// 					// error is a Parse.Error with an error code and message.
// 					callback( error, null );
// 				}
// 				});
// 			} else {
// 				callback( "not found", null );
// 			}
// 		},
// 		error: function(error){
// 			console.log("got an error:",error);
// 			callback( error, null );
// 		}
// 	});
// };

// exports.updateExistingStory = function( user, msg, files, process_cb, finish_cb ){
	
// 	var Story = Parse.Object.extend("Story");
// 	var query = new Parse.Query(Story);
	
// 	console.log("going to try to find '"+msg.storyId+"'");
	
// 	query.get(msg.storyId,{
// 		success: function(story) {
// 			// The object was retrieved successfully.
// 			//callback( null )
// 			processFormIntoStory( story, user, msg, files, process_cb, finish_cb );
// 		},
// 		error: function(object, error) {
// 			// The object was not retrieved successfully.
// 			// error is a Parse.Error with an error code and message.
// 			finish_cb( error );
// 		}
// 	});
// };

// exports.createNewStory = function( user, msg, files, process_cb, finish_cb ){

// 	processFormIntoStory( null, user, msg, files, process_cb, function(error){
// 		console.log("createNewStory - error was", error );
// 		if (!error && msg.locations !== undefined && msg.locations.length > 0){
// 			// send push here!!
// 			// get title
// 			var title = msg.title;
// 			// capitalise the first letter
// 			title = title.charAt(0).toUpperCase() + title.substr(1);
// 			// get a list of resorts / locations and covert space to underscore.
// 			var channels = [];
// 			for(var i=0;i<msg.locations.length;i++){
// 				channels.push( msg.locations[i].split(" ").join("_") );
// 			}
// 			//
// 			var data = {
// 					alert: title,
// 					badge: "increment",
// 					sound: "default"
// 				};
			
// 			console.log("calling 'sendPushToChannels' with", channels, data );
			
// 			Parse.Cloud.run("sendPushToChannels", {
// 				channels: channels,
// 				data: data
// 			},{
// 				success: function() {
// 					console.log("success calling 'sendPushToChannels");
//   				},
//   				error: function(error) {
// 					console.log("error calling 'sendPushToChannels", error);
//   				}
//   			});
// 		}
// 		finish_cb( error );
// 	});
// };

// const cropAndResizeAspectFill = function( image_path, width, height, callback ){
	
// 	var image = gm( image_path );
// 	var exportPath = image_path.substr( 0, image_path.length-4 ) + "_"+width+"x"+height+".png";
	
	
// 	/*
// 	The '^' argument on the resize function will tell GraphicsMagick to use the height 
// 	and width as a minimum instead of the default behavior, maximum. 
// 	The resulting resized image will have either the width or height be your designated 
// 	dimension, while the non-conforming dimension is larger than the specified size.

// 	Then gravity function tells GraphicsMagick how the following crop function 
// 	should behave, which will crop the image to the final size.
// 	*/
// 	image.resize( width, height, "^" )
// 		.gravity('Center')
// 		.crop(width, height)
// 		.write(exportPath, function (err) {
// 			//if (!err) console.log(' hooray! ');
// 			callback( err, exportPath );
// 		});
		
// 	/*
// 	image.size( function( err, size ){
// 		if (err){
// 			callback( err, null )
// 		} else {
				
// 		}
// 	})
// 	*/
// };

// function processFormIntoStory( story, user, msg, files, process_cb, finish_cb ){
	
// 	var clientId = getClientId(user);
	
// 	var publishDate = new Date();
// 	if (msg.publishDate){
// 		publishDate = moment( msg.publishDate ).toDate();
// 	}
// 	var expiryDate = new Date();
// 	if (msg.expiryDate){
// 		expiryDate = moment( msg.expiryDate ).toDate();
// 	}
	
// 	var sharing = false;
// 	if (msg.sharing !== undefined && msg.sharing === 'on'){
// 		sharing = true;
// 	}
// 	var locations = [];
// 	if (msg.locations !== undefined){
// 		locations = msg.locations;
// 	}

// 	var tags = [];
// 	if (msg.tags !== undefined){
// 		tags = msg.tags;
// 	}
	
// 	var objectToSave = {
// 		title: msg.title,
// 		details: msg.details,
// 		publishDate: publishDate,
// 		expiryDate: expiryDate,
// 		resorts: locations,
// 		sharingEnabled: sharing,
// 		client: clientId,
// 		tags: tags
// 	};

// 	if (msg.youtube !== undefined && msg.youtube !== ""){
// 		objectToSave['ytCode'] = msg.youtube;
// 	}
	
// 	if (files['pdf'] !== undefined){
	
// 		console.log("there was a PDF in the upload");
// 		var fileData = fs.readFileSync( files['pdf'] );
// 		//Parse wants an array of data, so convert the Buffer object to one
// 		//See https://groups.google.com/forum/?fromgroups#!topic/nodejs/5AFLWNDg578
// 		fileData = Array.prototype.slice.call(new Buffer(fileData), 0);
// 		var parseFile = new Parse.File("upload.pdf", fileData);
// 		objectToSave['pdfFile'] = parseFile;

// 		fs.unlinkSync( files['pdf'] );
		
// 		process_cb("preparing PDF");
// 	}
	
// 	if (files['image'] === undefined){
// 		reallySaveStoryToServer( story, objectToSave, process_cb, finish_cb );	
// 	} else {
// 		var image_path = files['image'];
		
// 		async.parallel({
// 			iPhone4_5SImageFile: function( cb ){
// 				cropAndResizeAspectFill( image_path, 640, 1136, function(err,path){
// 					process_cb("preparing iPhone4 image");
// 					cb(err,path);
// 				});
// 			},
// 			iPhone6ImageFile: function( cb ){
// 				cropAndResizeAspectFill( image_path, 750, 1334, function(err,path){
// 					process_cb("preparing iPhone6 image");
// 					cb(err,path);
// 				} );
// 			},
// 			iPhone6PlusImageFile: function( cb ){
// 				cropAndResizeAspectFill( image_path, 1242, 2208, function(err,path){
// 					process_cb("preparing iPhone6+ image");
// 					cb(err,path);
// 				} );
// 			},
// 			iPadImageFile: function( cb ){
// 				cropAndResizeAspectFill( image_path, 1536, 2048, function(err,path){
// 					process_cb("preparing iPad image");
// 					cb(err,path);
// 				} );
// 			},
// 			thumbnailImageFile: function( cb ){
// 				cropAndResizeAspectFill( image_path, 148, 148, function(err,path){
// 					process_cb("preparing iPhone Thumbnail image");
// 					cb(err,path);
// 				} );
// 			},
// 			thumbnailImageFileIPad: function( cb ){
// 				cropAndResizeAspectFill( image_path, 222, 222, function(err,path){
// 					process_cb("preparing iPad Thumbnail image");
// 					cb(err,path);
// 				} );
// 			},
// 		}, function(err, results){
// 			if (err){
// 				// do something about the error here
//             console.log("err", err);            
// 			} else {
// 				for( var key in results ){
// 					fileData = fs.readFileSync( results[key] );
// 					//Parse wants an array of data, so convert the Buffer object to one
// 					//See https://groups.google.com/forum/?fromgroups#!topic/nodejs/5AFLWNDg578
// 					fileData = Array.prototype.slice.call(new Buffer(fileData), 0);
// 					parseFile = new Parse.File("image.png", fileData);
// 					objectToSave[key] = parseFile;
// 					console.log("created parseFile for '"+key+"'");
// 					// delete the files
// 					fs.unlinkSync( results[ key ] );
// 				}
// 				// delete the origin file
// 				fs.unlinkSync( image_path );
// 				reallySaveStoryToServer( story, objectToSave, process_cb, finish_cb );
// 			}
// 		});
// 	}
// };

// function reallySaveStoryToServer( storyInstance, objectToSave, process_cb, finish_cb )
// {
	
// 	if (storyInstance == null){
// 		var Story = Parse.Object.extend("Story");
// 		storyInstance = new Story();
// 	}
	
// 	process_cb("saving Story");
	
// 	storyInstance.save(objectToSave, 
// 	{
// 		success: function(story) {
// 			// The object was saved successfully.
// 			console.log("saved story!");
// 			finish_cb( null );
// 		},
// 		error: function(story, error) {
// 			// The save failed.
// 			// error is a Parse.Error with an error code and message.
// 			console.log("failed to create story:", error );
// 			finish_cb( error );
// 		}
// 	});
// };