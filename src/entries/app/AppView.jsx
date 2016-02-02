/* @flow */
/* eslint no-useless-constructor: 0 */

import React from 'react';
import WelcomeBox from '../../components/WelcomeBox';

type AppViewProps = {
  message: string;
  bgColor?: string;
};

type AppViewStates = {

};

class AppView extends React.Component {

  static defaultProps = {

  };

  constructor(props: AppViewProps) {
    super(props);
    // Operations usually carried out in componentWillMount go here
  }

  state: AppViewStates = {

  };

  render(): React.Element {
    return (
      <div className="app">
        <WelcomeBox {...this.props} />
      </div>
    );
  }

}

export default AppView;
