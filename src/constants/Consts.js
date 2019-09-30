export const Products = [
  {
    // id: "prod_DyU4DpTOVumfUo", // test
    id: "prod_Dwk9bjAU5cwEum", // live
    created: 1541834004,
    name: "Pocket Concierge Monthly",
    updated: 1568029240
  },
  {
    id: "prod_FmJdX461HEZ1zk",
    created: 1568028337,
    name: "Pocket Concierge Annual",
    updated: 1568368491
  }
];

// export const STRIPE_PUBLISHABLE_KEY = 'pk_test_4BIow6BKcVmhzH0AR24IkGZo';
export const STRIPE_PUBLISHABLE_KEY = 'pk_live_gKmrIoRSfat2WFLuRlUQAt03';


// test
// export const PRODUCT_PLANS = [
//   {
//     id: 'plan_DyUVmIOk8DJ90M',
//     name: 'Pocket Concierge Monthly - 30 Days Free',
//     product: 'prod_DyU4DpTOVumfUo', 
//     price: 3900,
//     created: 1542237089,
//     currency: "$",
//     interval: "monthly",
//     interval_count: 1,
//     trial_period_days: 30,
//   },
//   {
//     id: 'plan_DyUVmIOk8DJ90M',
//     name: 'Pocket Concierge Annual',
//     product: 'prod_DyU4DpTOVumfUo', 
//     price: 34900,
//     created: 1568028401,
//     currency: "$",
//     interval: "annual",
//     interval_count: 1,
//     trial_period_days: null,
//   }
// ];

// live
export const PRODUCT_PLANS = [
  {
    id: 'plan_EFYdJow2uHM37C',
    name: 'Pocket Concierge Monthly',
    product: 'prod_Dwk9bjAU5cwEum', 
    price: 3900,
    created: 1546173357,
    currency: "$",
    interval: "monthly",
    interval_count: 1,
    trial_period_days: null,
  },
  {
    id: 'plan_FmJeuC6yfGATyB',
    name: 'Pocket Concierge Annual',
    product: 'prod_FmJdX461HEZ1zk', 
    price: 34900,
    created: 1568028401,
    currency: "$",
    interval: "annual",
    interval_count: 1,
    trial_period_days: null,
  }
];

