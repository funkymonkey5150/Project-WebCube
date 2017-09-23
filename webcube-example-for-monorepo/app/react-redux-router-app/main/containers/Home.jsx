import React, { PureComponent } from 'react';
import Helmet from 'react-helmet';
import * as myActions from '../actions';
import { connect, stateSelector, actionDispatcher } from 'webcube/boilerplate';

@connect()
@stateSelector(
  state => state.homeModel,
  homeModel => ({
    message: homeModel.message,
    list: homeModel.list,
  }),
)
@actionDispatcher(
  {
    add: myActions.addItem,
    remove: myActions.removeItem,
  },
  'actions',
)
export default class Home extends PureComponent {
  render() {
    const { message } = this.props;
    return (
      <div>
        <Helmet
          title="React Redux Router App - Home"
          meta={[{ name: 'description', content: '' }]}
        />
        {message}
      </div>
    );
  }
}
