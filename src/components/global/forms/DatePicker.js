import 'date-fns';
import React from 'react';
import DateFnsUtils from '@date-io/date-fns';
import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker,
} from '@material-ui/pickers';

export default class MaterialUIPickers extends React.Component {
   constructor(props) {
      super(props);
      this.state = {
      }
   }

   render() {
      return (
         <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <KeyboardDatePicker
               margin="normal"
               id="mui-pickers-date"
               value={this.props.initTime}
               onChange={(date) => this.props.handleChange(date, this.props.name)}
               KeyboardButtonProps={{
                  'aria-label': 'change date',
               }}
               name={this.props.name}
               className="ml-20"
            />
         </MuiPickersUtilsProvider>
      );      
   }
}