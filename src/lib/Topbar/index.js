import React from 'react';
import PropTypes from 'prop-types';

class Topbar extends React.Component {
  static displayName = 'Topbar';

  state = {
    isMobileOpen: false,
    activeIndex: null,
    focus: 0,
  };

  getChildContext = () => {
    return {
      activeIndex: this.state.activeIndex,
      onActivate: index => this.setSelected(index),
      onFocus: index => this.setState(() => ({ focus: index })),
      focus: this.state.focus,
    };
  };

  setSelected = index => {
    if (index === this.state.activeIndex) return;
    this.setState(() => ({ activeIndex: index }));
  };

  render() {
    const {
      anchor,
      brandAnchorElement,
      color,
      fixed,
      icon,
      image,
      title
    } = this.props;

    const cuiTopBarClass = 'cui-top-bar';
    const cuiBrandClass = 'cui-brand';

    const brandNodeChildren = ([
      <div className={`${cuiBrandClass}__logo`} key={`${cuiBrandClass}__logo`}>
        {
          image
            ? image
            : <i className={`icon ${icon}`} />
        }
      </div>,
      <div className={`${cuiBrandClass}__title`} key={`${cuiBrandClass}__title`}>
        {title}
      </div>
    ]);

    const getBrandAnchor = () => (
      brandAnchorElement
        ? React.cloneElement(
            brandAnchorElement,
            {
              className: `${cuiBrandClass}` + 
                `${(brandAnchorElement.props.className && ` ${brandAnchorElement.props.className}`) || ''}`,
            },
            brandNodeChildren
          )
        : <a className={cuiBrandClass} href={anchor}>
            {brandNodeChildren}
          </a>
    );

    const brandNode = (
      <div className={`${cuiTopBarClass}__brand`}>
        {getBrandAnchor()}
      </div>
    );

    const injectChildren = React.Children.map(this.props.children, child => {
      if (child.type.displayName === 'TopbarMobile') {
        return React.cloneElement(child, {
          brandNode
        });
      } else {
        return child;
      }
    });

    return (
      <div
        className={`${cuiTopBarClass}` +
        `${(fixed && ` ${cuiTopBarClass}--fixed`) || ''}` +
        ` ${cuiTopBarClass}--${color}`
        }
        role="navigation"
        ref={ref => {
          this.parentContainer = ref;
        }}>
        <div className={`${cuiTopBarClass}__container row`}>
          {brandNode}
          {injectChildren}
        </div>
      </div>
    );
  }
}

Topbar.childContextTypes = {
  focus: PropTypes.number,
  activeIndex: PropTypes.number,
  onActivate: PropTypes.func,
  onFocus: PropTypes.func,
};

Topbar.propTypes = {
  /** App Url/Link (String) */
  anchor: PropTypes.string,
  /** Custom Node to wrap (Element) */
  brandAnchorElement: PropTypes.element,
  /** Title Text (String or Template) */
  title: PropTypes.string,
  /** Icon Class (String or Template) */
  icon: PropTypes.string,
  /** Image Source URL (String or Template) */
  image: PropTypes.node,
  /** Header Color (String) */
  color: PropTypes.string,
  /** Top-bar fixed to top (Boolean) */
  fixed: PropTypes.bool,
  /** children prop */
  children: PropTypes.node,
  /** HTML Class for Top Bar */
  className: PropTypes.string,
};

Topbar.defaultProps = {
  anchor: null,
  brandAnchorElement: null,
  children: null,
  className: '',
  color: 'dark',
  fixed: false,
  icon: 'icon-cisco-logo',
  image: null,
  title: '',
};

export default Topbar;