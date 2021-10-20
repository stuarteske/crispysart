import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'


export default class PageLoader extends React.Component {
    render() {
        return (
            <div className="page-loader w-full h-full fixed block top-0 left-0 bg-black opacity-75 z-50">
          <span className="text-white top-1/2 my-0 mx-auto block relative w-0 h-0"
              //style="top: 50%;"
          >
            <FontAwesomeIcon icon={faCircleNotch} size="4x" spin />
            <h2>{this.props.title}</h2>
          </span>
            </div>
        );
    }
}
