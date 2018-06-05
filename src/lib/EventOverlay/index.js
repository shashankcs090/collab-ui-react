import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';

export default class EventOverlay extends React.Component {
  static displayName = 'EventOverlay';

  state = {
    visibleDirection: this.props.direction,
  };

  componentDidMount = () => {
    this.addHandlers();
  };

  componentDidUpdate = prevProps => {
    if (
      (
        this.props.isOpen
        &&
        prevProps.isOpen !== this.props.isOpen
      )
      ||
      prevProps.direction !== this.props.direction
    ) {
      return this.forceUpdate(() => this.isVisible());
    }
  };

  componentWillUnmount = () => {
    this.removeHandlers();
  };

  isVisible = () => {
    const { direction, isOpen, anchorNode, showArrow, isDynamic, targetOffset } = this.props;
    if (!isOpen) return;
    if (!isDynamic) return this.setPlacement();
    const element = ReactDOM.findDOMNode(this.container);
    const elementAnchor = ReactDOM.findDOMNode(anchorNode);
    const alignment = direction.split('-')[1];
    let tempParentArr = [];
    const anchor = elementAnchor && elementAnchor.getBoundingClientRect();
    const elementBoundingRect = element.getBoundingClientRect();
    const elementParent = element.parentElement;
    const windowBottom = window.pageXOffset + window.innerHeight;
    const elementHeight = elementBoundingRect.height;
    const anchorBottom = anchor.bottom;
    const arrowHeight = showArrow
      ? ReactDOM.findDOMNode(this.arrow).getBoundingClientRect().height
      : 0;
    const offsetHeight = targetOffset.height || 0;
    const totalHeight = anchorBottom + elementHeight + arrowHeight + offsetHeight;

    const findParents = elem => {
      return !elem.parentElement
        ? tempParentArr
        : findParents(elem.parentElement, tempParentArr.push(elem));
    };

    const elementParents = findParents(elementParent);

    const findOverflow = node => {
      const searchProps = ['overflow', 'overflow-y'];

      return searchProps.reduce((agg, prop) => {
        let overflowElement = ReactDOM.findDOMNode(node).style[prop];

        return !overflowElement || agg.includes(overflowElement)
          ? agg
          : (agg += overflowElement);
      }, '');
    };

    const findScrollParent = () => {
      let overflowElement = null;
      let idx = 0;

      while (!overflowElement && elementParents[idx]) {
        if (/(auto|scroll)/.test(findOverflow(elementParents[idx]))) {
          return (overflowElement = elementParents[idx]);
        }
        idx++;
      }

      return overflowElement ? overflowElement : window;
    };

    const scrollParent = findScrollParent(element);
    const parentBottom =
      (!!scrollParent.getBoundingClientRect &&
        scrollParent.getBoundingClientRect().bottom) ||
      windowBottom;

    return totalHeight < parentBottom && totalHeight < windowBottom
      ? this.setState({ visibleDirection: `bottom-${alignment}` }, () => this.setPlacement())
      : this.setState({ visibleDirection: `top-${alignment}` }, () => this.setPlacement());
  };

  addHandlers = () => {
    const { allowClickAway } = this.props;
    this.handleResize = this.isVisible;
    this.handleScroll = this.isVisible;

    allowClickAway && window.addEventListener('click', this.handleClick, false);
    window.addEventListener('resize', this.handleResize, true);
    window.addEventListener('scroll', this.handleScroll, false);
    window.addEventListener('keyup', this.handleKeyUp, true);

    this.isVisible();
  };

  removeHandlers = () => {
    window.removeEventListener('click', this.handleClick, false);
    window.removeEventListener('resize', this.handleResize, true);
    window.removeEventListener('scroll', this.handleScroll, false);
    window.removeEventListener('keyup', this.handleKeyUp, true);
  };

  handleKeyUp = e => {
    if (!this.props.isOpen) return;
    if (e.keyCode === 27) return this.handleClickAway(e);
    const anchorNode = ReactDOM.findDOMNode(this.props.anchorNode);

    return (
      this.container
        && !anchorNode.contains(document.activeElement)
        && !ReactDOM.findDOMNode(this.container).contains(document.activeElement)
        && this.handleClickAway(e)
    );
  };

  handleClick = e => {
    if (!this.props.isOpen) return;
    const anchorNode = ReactDOM.findDOMNode(this.props.anchorNode);
    return (
      this.container
        && !ReactDOM.findDOMNode(anchorNode).contains(e.target)
        && (
          this.props.closeOnClick
          ||
          !ReactDOM.findDOMNode(this.container).contains(e.target)
        )
        && this.handleClickAway(e)
    );
  };

  getAnchorPosition = node => {
    const rect = node.getBoundingClientRect();

    const anchorPosition = {
      top: rect.top,
      left: rect.left,
      width: node.offsetWidth,
      height: node.offsetHeight
    };

    anchorPosition.right =
      rect.right || anchorPosition.left + anchorPosition.width;
    anchorPosition.bottom =
      rect.bottom || anchorPosition.top + anchorPosition.height;
    anchorPosition.middle =
      anchorPosition.left + (anchorPosition.right - anchorPosition.left) / 2;
    anchorPosition.center =
      anchorPosition.top + (anchorPosition.bottom - anchorPosition.top) / 2;

    return anchorPosition;
  };

  getTargetPosition = targetNode => {
    return {
      top: 0,
      center: targetNode.offsetHeight / 2,
      bottom: targetNode.offsetHeight,
      left: 0,
      middle: targetNode.offsetWidth / 2,
      right: targetNode.offsetWidth
    };
  };

  getOrigin = () => {
    const side = this.state.visibleDirection.split('-')[0];
    const alignment = this.props.direction.split('-')[1];
    const origin = {
      anchor: {},
      target: {}
    };

    if (side === 'top' || side === 'bottom') {
      origin.anchor.vertical = side;
      origin.anchor.horizontal = alignment === 'center' ? 'middle' : alignment;

      origin.target.vertical = side === 'top' ? 'bottom' : 'top';
      origin.target.horizontal = alignment === 'center' ? 'middle' : alignment;
    }

    if (side === 'left' || side === 'right') {
      origin.anchor.vertical = alignment;
      origin.anchor.horizontal = side;

      origin.target.vertical = alignment;
      origin.target.horizontal = side === 'left' ? 'right' : 'left';
    }

    return origin;
  };

  setArrowPlacement = anchor => {
    const arrow = this.arrow;
    const { targetOffset } = this.props;
    const { visibleDirection } = this.state;
    const side = visibleDirection.split('-')[0];
    const verticalOffset = targetOffset.vertical || 0;
    const horizontalOffset = targetOffset.horizontal || 0;

    switch (side) {
      case 'top':
        arrow.style.left = `${anchor.middle}px`;
        arrow.style.top = `${anchor.top - verticalOffset}px`;
        break;
      case 'bottom':
        arrow.style.left = `${anchor.middle}px`;
        arrow.style.top = `${anchor.bottom + verticalOffset}px`;
        break;

      case 'left':
        arrow.style.left = `${anchor.left - horizontalOffset}px`;
        arrow.style.top = `${anchor.center}px`;
        break;

      case 'right':
        arrow.style.left = `${anchor.right + horizontalOffset}px`;
        arrow.style.top = `${anchor.center}px`;
        break;
    }
  };

  setPlacement = () => {
    const {
      isOpen,
      anchorNode,
      maxHeight,
      targetOffset
    } = this.props;
    const { visibleDirection } = this.state;
    if (!isOpen) return;

    const anchorNodeFound = ReactDOM.findDOMNode(anchorNode);
    const side = visibleDirection.split('-')[0];
    const targetNode = this.container;
    const verticalOffset = targetOffset.vertical || 0;
    const horizontalOffset = targetOffset.horizontal || 0;

    if (!targetNode || !anchorNodeFound) return;

    anchorNodeFound.link = this.state.id;
    const anchorPosition = this.getAnchorPosition(anchorNodeFound);
    const targetPosition = this.getTargetPosition(targetNode);

    const origin = this.getOrigin();

    const anchorOrigin = origin.anchor;
    const targetOrigin = origin.target;

    const targetNodePosition = {
      top:
        anchorPosition[anchorOrigin.vertical] -
        targetPosition[targetOrigin.vertical] +
        (side === 'top' ? -verticalOffset : verticalOffset),
      left:
        anchorPosition[anchorOrigin.horizontal] -
        targetPosition[targetOrigin.horizontal] +
        (side === 'left' ? -horizontalOffset : horizontalOffset)
    };

    targetNode.style.top = `${targetNodePosition.top}px`;
    targetNode.style.left = `${targetNodePosition.left}px`;
    targetNode.style.maxHeight = maxHeight && `${maxHeight}px`;

    this.props.showArrow && this.setArrowPlacement(anchorPosition);
  };

  handleClickAway = e => {
    this.props.close && this.props.close(e);
  };

  render() {
    const { className, isOpen, children, showArrow } = this.props;
    const side = this.state.visibleDirection.split('-')[0];
    const contentNodes = (
      <div
         className={
          'cui-event-overlay' +
          `${(showArrow && ` cui-event-overlay--arrow`) || ''}` +
          `${(side && ` cui-event-overlay--${side}`) || ''}` +
          `${(className && ` ${className}`) || ''}`
        }
      >
        {showArrow && (
          <div
            ref={ref => this.arrow = ref}
            className='cui-event-overlay__arrow'
          />
        )}
        <div
          className='cui-event-overlay__children'
          ref={ref => this.container = ref}
        >
          {children}
        </div>
      </div>
    );

    return isOpen && contentNodes;
  }
}

EventOverlay.defaultProps = {
  allowClickAway: true,
  anchorNode: null,
  children: null,
  className: '',
  close: null,
  isDynamic: false,
  isOpen: false,
  direction: 'bottom-left',
  targetOffset: {
    horizontal: 0,
    vertical: 0
  },
  showArrow: false,
  maxHeight: null,
};

EventOverlay.propTypes = {
  allowClickAway: PropTypes.bool,
  anchorNode: PropTypes.object,
  children: PropTypes.node,
  className: PropTypes.string,
  close: PropTypes.func,
  isDynamic: PropTypes.bool,
  isOpen: PropTypes.bool,
  targetOffset: PropTypes.shape({
    horizontal: PropTypes.number,
    vertical: PropTypes.number
  }),
  direction: PropTypes.oneOf([
    'top-center',
    'left-center',
    'right-center',
    'bottom-center',
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
    'left-top',
    'left-bottom',
    'right-top',
    'right-bottom'
  ]),
  showArrow: PropTypes.bool,
  closeOnClick: PropTypes.bool,
  maxHeight: PropTypes.number,
};