/**
 * Statistics Page
 */
/* eslint-disable */
import React, { Fragment } from 'react';
import { connect } from "react-redux";

//component
import ContentLoader from '../../components/global/loaders/ContentLoader';
import PageTitle from '../../components/widgets/PageTitle';
import parse from '../../parse/parse';
import { showAlert } from "../../actions/action";
import authAction from '../../reducers/auth/actions';
import DatePicker from '../../components/global/forms/DatePicker';

import CardContent from '@material-ui/core/CardContent';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import FormControl from '@material-ui/core/FormControl';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';

function TabContainer({ children, dir }) {
   return (
      <Typography component="div" dir={dir} style={{ padding: 8 * 3 }}>
         {children}
      </Typography>
   );
}

const columns = ['iOS', 'Android', 'Total'];

class StatisticsPage extends React.Component {

   constructor(props) {
      super(props);
      this.state = {
         user: null,
         fields: {
				dateRange: 'yesterday',
				startDate: new Date(),
            endDate: new Date()
			},
			startDate: new Date(),
			endDate: new Date(),
			statisticData: {
				iosApp: 0,
				androidApp: 0,
				iosUser: 0,
				androidUser: 0
			}
		};
		this.handleDate = this.handleDate.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.getStatisticData = this.getStatisticData.bind(this);
      this._isMounted = false;
   }

   UNSAFE_componentWillMount() {
      this._isMounted = true;
		const self = this;
		var startDate = this.state.startDate;

		startDate.setDate(startDate.getDate() - 1);

		self._isMounted && parse.createUserFromToken( self.props.token, function( err, user ){
         if (err) {
            self._isMounted && self.props.logout();
         } else { 
            self._isMounted && self.setState({user});
				self._isMounted && parse.getStatistics(user, startDate, self.state.endDate, function(err, res) {
					if (err) {
						self._isMounted && self.props.showAlert(err.message, 'error');
					} else {
						self._isMounted && self.setState({ statisticData: res });
					}
				});
			}
		})
   }

   componentWillUnmount() {
      this._isMounted = false;
	}
	
	handleDate(e, field) {
      const fields = this.state.fields;
		fields[field] = e;
		
		this.setState({ fields, [field]: e }, function() {
			this.getStatisticData();
		});
	}

   handleChange = (e) => {
		const fields = this.state.fields;
		var startDate = new Date();
		var endDate = new Date();
		fields['dateRange'] = e.target.value;
		if (e.target.value === 'yesterday') {
			startDate.setDate(startDate.getDate() - 1);			
		} else if (e.target.value === 'last7days') {
			startDate.setDate(startDate.getDate() - 7);
		} else if (e.target.value === 'thismonth') {
			startDate.setDate(startDate.getDate() - startDate.getDate());
		} else if (e.target.value === 'lastmonth') {
			startDate.setDate(startDate.getDate() - startDate.getDate() - 30);
			endDate.setDate(endDate.getDate() - endDate.getDate());
		} else if (e.target.value === 'last3months') {
			startDate.setDate(startDate.getDate() - 90);
		}
      this.setState({ fields, startDate, endDate }, function() {
			this.getStatisticData();
		});
	};
	
	getStatisticData() {
		const self = this;

      self._isMounted && parse.getStatistics(self.state.user, self.state.startDate, self.state.endDate, function(err, res) {
         if (err) {
            self._isMounted && self.props.showAlert(err.message, 'error');
         } else {
				self._isMounted && self.setState({ statisticData: res });
			}
      });
	}

   tableCell = (list, keys) => {
      var temp = keys.map((key, index) => {
         return(<TableCell key={index}>{list[key]}</TableCell>)
      });
      return temp;      
   }

   render() {
		const { statisticData } = this.state;

      return (
         <Fragment>
            <PageTitle
               title="Statistics"
            />
            <div className="container mt-20">
					<Grid container spacing={5}>
               	<Grid item xs={12} sm={12} md={5} lg={4}>
							<Card>
								<CardContent>
									<h5>Date Range</h5>
									<FormControl component="fieldset" className="ml-10 mb-10">
										<RadioGroup
											aria-label="dateRange"
											name="dateRange"
											onChange={this.handleChange}
										>
											<FormControlLabel name="dateRange" value="yesterday" control={<Radio className="checkbox-color" checked={this.state.fields['dateRange'] === "yesterday"} />} label="Yesterday" />
											<FormControlLabel name="dateRange" value="last7days" control={<Radio className="checkbox-color" checked={this.state.fields['dateRange'] === "last7days"} />} label="Last 7 days" />
											<FormControlLabel name="dateRange" value="thismonth" control={<Radio className="checkbox-color" checked={this.state.fields['dateRange'] === "thismonth"} />} label="This month" />
											<FormControlLabel name="dateRange" value="lastmonth" control={<Radio className="checkbox-color" checked={this.state.fields['dateRange'] === "lastmonth"} />} label="Last month" />
											<FormControlLabel name="dateRange" value="last3months" control={<Radio className="checkbox-color" checked={this.state.fields['dateRange'] === "last3months"} />} label="Last 3 months" />
										</RadioGroup>
									</FormControl>
									<h5>Enter Date Range</h5>
									<p className="lead ml-10" style={{marginBottom: '-10px'}}>From</p>
									<DatePicker name={"startDate"} initTime={this.state.fields['startDate']} handleChange={this.handleDate} />
									<p className="lead ml-10" style={{marginBottom: '-10px'}}>To</p>
									<DatePicker name={"endDate"} initTime={this.state.fields['endDate']} handleChange={this.handleDate} />
								</CardContent>
							</Card>
						</Grid>
						<Grid item xs={12} sm={12} md={7} lg={8}>
							<Grid container spacing={3}>
								<Grid item xs={12} sm={12} md={12} lg={12}>
									<Card className="statistic-card">
										<CardContent className="p-30">
											<h5>IOS/Android/Total downloads</h5>
											<TabContainer>
												<Table className="table-wrap" >
													<TableHead>
														<TableRow>
															{columns.map((th, index) => (
																<TableCell key={index} className="fw-bold">{th}</TableCell>
															))}
														</TableRow>
													</TableHead>
													<TableBody>
														<TableRow>
															<TableCell>{this.state.statisticData.iosApp}</TableCell>
															<TableCell>{this.state.statisticData.androidApp}</TableCell>
															<TableCell>{this.state.statisticData.iosApp + this.state.statisticData.androidApp}</TableCell>
														</TableRow>
													</TableBody>
												</Table>
											</TabContainer>
										</CardContent>
									</Card>
								</Grid>
								<Grid item xs={12} sm={12} md={12} lg={12}>
									<Card className="statistic-card">
										<CardContent className="p-30">
											<h5>IOS/Android/Total active users</h5>
											<TabContainer>
												<Table className="table-wrap" >
													<TableHead>
														<TableRow>
															{columns.map((th, index) => (
																<TableCell key={index} className="fw-bold">{th}</TableCell>
															))}
														</TableRow>
													</TableHead>
													<TableBody>
														<TableRow>
															<TableCell>{this.state.statisticData.iosUser}</TableCell>
															<TableCell>{this.state.statisticData.androidUser}</TableCell>
															<TableCell>{this.state.statisticData.iosUser + this.state.statisticData.androidUser}</TableCell>
														</TableRow>
													</TableBody>
												</Table>
											</TabContainer>
										</CardContent>
									</Card>
								</Grid>
							</Grid>
						</Grid>
					</Grid>
            </div>
				<div style={{height: 100}}></div>
         </Fragment>
      )
   }
}

// map state to props
const mapStateToProps = state => {
   const token = state.Auth.idToken;
   return { token };
}

export default connect(mapStateToProps, {showAlert, logout: authAction.logout})(StatisticsPage);