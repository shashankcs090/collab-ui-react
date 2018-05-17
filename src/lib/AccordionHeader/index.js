/**
 * @category layout
 * @component accordion
 * @variations collab-ui-react
 */

import React from 'react';
import PropTypes from 'prop-types';

export default class AccordionHeader extends React.Component {
  static displayName = 'AccordionHeader';

  static contextTypes = {
    onClick: PropTypes.func,
    onKeyDown: PropTypes.func
  };

  componentDidUpdate(prevProps) {
    const { focus } = this.props;
    !prevProps.focus && focus && this.headerRef.focus();
  }

  render() {
    const {
      children,
      className,
      disabled,
      showSeparator,
      height,
    } = this.props;

    const { onClick, onKeyDown } = this.context;

    return (
      <div
        role='button'
        ref={ref => this.headerRef = ref}
        onClick={onClick}
        onKeyDown={onKeyDown}
        tabIndex={!disabled ? 0 : -1}
        className={
          'cui-accordion__header' +
          `${(showSeparator && ` cui-accordion__header--separator`) || ''}` +
          `${(height && ` cui-accordion__header--${height}`) || ''}` +
          `${(className && ` ${className}`) || ''}`
        }
      >
          {children}
          <span className="cui-accordion__header-icon"/>
      </div>
    );
  }
}

AccordionHeader.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  focus: PropTypes.bool,
  showSeparator: PropTypes.bool,
  height: PropTypes.oneOf(['', 56]),
};

AccordionHeader.defaultProps = {
  children: null,
  className: '',
  disabled: false,
  focus: false,
  showSeparator: true,
  height: '',
};
