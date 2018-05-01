import React from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-aria-modal';
import { Spinner, Tooltip, Icon } from '@collab-ui/react';

export default class Lightbox extends React.Component {
  static displayName = 'Lightbox';

  state = {
    viewportDimensions: {
      width: 600,
      height: 600
    },
    zoom: 1
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown, true);
    window.addEventListener('resize', this.handleResize, true);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.index !== this.props.index && this.state.zoom > 1 && this.imgWrapper) {
      const viewportNode = this.viewport;
      viewportNode.scrollTop = 0;
      viewportNode.scrollLeft = (this.imgWrapper.offsetWidth - viewportNode.offsetWidth) / 2;
    }
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown, true);
    window.removeEventListener('resize', this.handleResize, true);
  }

  handleResize = () => {
    const { viewport } = this;
    this.setState({
      viewportDimensions: {
        width: viewport.offsetWidth,
        height: viewport.offsetHeight
      }
    });
  }

  handleKeyDown = e => {
    const { index, onClose, pages } = this.props;
    let newIndex;

    switch (e.keyCode) {
      // Escape
      case 27:
        onClose();
        return;
      // left arrow & up arrow
      case 37:
      case 38:
        newIndex = Math.max(index - 1, 0);
        break;
      // right arrow & down arrow
      case 39:
      case 40:
        newIndex = Math.min(index + 1, pages.length - 1);
        break;
      // page up & home
      case 33:
      case 36:
        newIndex = 0;
        break;
      // page down & end
      case 34:
      case 35:
        newIndex = pages.length - 1;
        break;
      // 1 - 9
      case 49:
      case 50:
      case 51:
      case 52:
      case 53:
      case 54:
      case 55:
      case 56:
      case 57:
        newIndex = Math.min(e.keyCode - 49, pages.length - 1);
        break;
      default:
        return;
    }

    this.triggerPageChange(newIndex, e);
  }

  handleThumbnailClick = index => {
    this.props.onChange(index);
  }

  triggerPageChange = (index, e) => {
    const { onChange, pages } = this.props;
    const target = this.lightBox && this.lightBox.querySelector(`[data-index='${index}']`);
    target && target.scrollIntoViewIfNeeded && target.scrollIntoViewIfNeeded();
    if (index >= 0 && index <= pages.length - 1) {
      onChange(index);
    }
    e && e.stopPropagation();
  }

  stopPropagation = e => {
    e.stopPropagation();
  }

  setZoom = increment => {
    const newZoom = this.state.zoom + increment;
    this.setState({
      zoom: newZoom < 0.25 ? 0.25 : newZoom
    });
  }

  render() {
    const { pages, index, width, height, tooltips, onDownload, downloading, info, name, onClose, applicationId } = this.props;
    const { zoom, viewportDimensions } = this.state;
    const currentPage = pages[index];
    const showColumn = pages.length > 1;

    const calculateAspectRatioFit = (srcWidth, srcHeight, maxWidth, maxHeight) => {
      const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight, 1);
      return {
        width: Math.round(srcWidth * ratio),
        height: Math.round(srcHeight * ratio)
      };
    };

    const getThumbnails = () => {
      const thumbnails = pages.map((page, idx) => {
        let key = `${idx}:${page.thumb}`;
        let body;

        if (page.decrypting) {
          const scale = width / 150;
          const scaleY = height / scale;
          const style = {
            height: Math.round(scaleY)
          };
          key += ':decrypting';

          body = (
            <div
              className={
                `cui-lightbox__thumbnail` +
                `${(!!page.decrypting && ` cui-lightbox__thumbnail--decrypting`) || ''}`
              }
              data-index={idx}
              style={style}
            >
              <Icon className="cui-lightbox__thumbnail--icon" name="secure_28" />
            </div>
          );
        }
        else {
          body = (
            <img
              alt=""
              className={
                `cui-lightbox__thumbnail` +
                `${(!!page.decrypting && ` cui-lightbox__thumbnail--decrypting`) || ''}`
              }
              data-index={idx}
              draggable="false"
              onDragStart={() => false}
              src={page.thumb}
            />
          );
        }

        return (
          <div
            className={
              'cui-lightbox__thumbnail-wrapper' +
              `${(idx === index && ` cui-lightbox__thumbnail-wrapper--selected`) || ''}`
            }
            key={key}
            onClick={() => this.handleThumbnailClick(idx)}
            onKeyPress={() => {}}
            role="button"
            tabIndex="0"
          >
            {body}
            <div>
              {idx + 1}
            </div>
          </div>
        );
      });
      return (
        <div className="cui-lightbox__list">
          {thumbnails}
        </div>
      );
    };

    const getViewport = () => {
      let viewport;
      const dimensions = calculateAspectRatioFit(
        width * zoom,
        height * zoom,
        viewportDimensions.width,
        viewportDimensions.height
      );
      let imageContainerStyles = {
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`
      };

      if (currentPage.content) {
        if (currentPage.fullView) {
          imageContainerStyles = {
              width:  '100%',
              height: '100%',
              overflow: 'hidden'
          };
        }
        viewport = (
          <div
            className="cui-lightbox__viewport-content"
            draggable="false"
            onClick={this.stopPropagation}
            onKeyPress={this.stopPropagation}
            onDoubleClick={() => this.setZoom(0.25)}
            onDragStart={() => false}
            role="button"
            tabIndex="0"
          >
            {currentPage.content}
          </div>
        );
      }
      else if (currentPage.image) {
        if (zoom <= 1) {
          /* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
          viewport = (
            <img
              alt=""
              className="cui-lightbox__viewport-image"
              draggable="false"
              onClick={this.stopPropagation}
              onKeyPress={this.stopPropagation}
              onDoubleClick={() => this.setZoom(0.25)}
              onDragStart={() => false}
              src={currentPage.image}
            />
          );
        }
        else {
          imageContainerStyles = {};
          viewport = (
            <img
              alt=""
              className="cui-lightbox__viewport-image"
              draggable="false"
              onClick={this.stopPropagation}
              onKeyPress={this.stopPropagation}
              onDoubleClick={() => this.setZoom(0.25)}
              onDragStart={() => false}
              src={currentPage.image}
              style={{
                maxHeight: height * zoom,
                maxWidth: width * zoom,
                minHeight: height * zoom,
                minWidth: width * zoom
              }}
            />
          );
        }
      }

      return (
        <div
          className="cui-lightbox__viewport-wrapper"
          ref={ref => this.imgWrapper = ref}
          style={imageContainerStyles}
        >
          {viewport}
        </div>
      );
    };



    const leftArrowControl = (
      <Tooltip tooltip={tooltips.previous} direction="right-center">
        <div
          className="cui-lightbox__page-control cui-lightbox__page-control-icon cui-lightbox__page-controls--left"
          role="button"
          tabIndex="0"
          onKeyPress={e => this.triggerPageChange(index - 1, e)}
          onClick={e => this.triggerPageChange(index - 1, e)}
          style={{transform: 'rotate(-180deg)'}}
        >
          <Icon name="arrow-right_16" />
        </div>
      </Tooltip>
    );

    const rightArrowControl = (
      <Tooltip tooltip={tooltips.next} direction="left-center">
        <div
          className="cui-lightbox__page-control cui-lightbox__page-control-icon cui-lightbox__page-controls--right"
          role="button"
          tabIndex="0"
          onKeyPress={e => this.triggerPageChange(index + 1, e)}
          onClick={e => this.triggerPageChange(index + 1, e)}
        >
          <Icon name="arrow-right_16" />
        </div>
      </Tooltip>
    );

    const viewportControls = () => {
      const downloadButton = (
        <div
          className="cui-lightbox__control cui-lightbox__control-download"
          tabIndex="0"
          role="button"
          onClick={onDownload}
          onKeyPress={onDownload}
        >
          <Icon name="download_16"/>
        </div>
      );

      const controlStyle = currentPage.content ? {
        visibility: 'hidden'
      } : {};

      const pageControl = pages.length > 1 ? (
        <div className="cui-lightbox__controls cui-lightbox__controls--center">
          <Tooltip tooltip={tooltips.previous}>
            <div className="cui-lightbox__control"
              onClick={e => this.triggerPageChange(index - 1, e)}
              role="button"
              tabIndex="0"
              onKeyPress={e => this.triggerPageChange(index - 1, e)}
              style={{transform: 'rotate(-180deg)'}}
            >
              <Icon name="arrow-right_16"/>
            </div>
          </Tooltip>
          <span className="cui-lightbox__control-value">{`${index + 1} / ${pages.length}`}</span>
          <Tooltip tooltip={tooltips.next}>
            <div className="cui-lightbox__control"
              role="button"
              onClick={e => this.triggerPageChange(index + 1, e)}
              tabIndex="0"
              onKeyPress={e => this.triggerPageChange(index + 1, e)}
            >
              <Icon name="arrow-right_16"/>
            </div>
          </Tooltip>
        </div>
      ) : (
        <div className="cui-lightbox__controls">
          <span className="cui-lightbox__control-value">{index + 1}</span>
        </div>
      );


      return (
        <div
          className="cui-lightbox__viewer-controls"
          onClick={this.stopPropagation}
          onKeyPress={this.stopPropagation}
          role="button"
          tabIndex="0"
        >
          <div className="cui-lightbox__controls" style={controlStyle}>
            <Tooltip tooltip={tooltips.zoomOut}>
              <div className="cui-lightbox__control"
                onClick={() => this.setZoom(-0.25)}
                role="button"
                tabIndex="0"
                onKeyPress={() => this.setZoom(-0.25)}
              >
                  <Icon name="zoom-out_16"/>
              </div>
            </Tooltip>
            <span className="cui-lightbox__control-value">{Math.round(zoom * 100)}%</span>
            <Tooltip tooltip={tooltips.zoomIn}>
              <div className="cui-lightbox__control"
                role="button"
                onClick={() => this.setZoom(0.25)}
                tabIndex="0"
                onKeyPress={() => this.setZoom(0.25)}
              >
                <Icon name="zoom-in_16"/>
              </div>
            </Tooltip>
          </div>
          {pageControl}
          <div className="cui-lightbox__controls" style={controlStyle}>
            <span className="cui-lightbox__control-value">{info.size}</span>
            <Tooltip tooltip={downloading ? tooltips.downloading : tooltips.download}>
                { downloading ?
                    <div className="cui-lightbox__control cui-lightbox__control-spinner">
                      <Spinner size={28}/>
                    </div> :
                    downloadButton
                }
            </Tooltip>
          </div>
        </div>
      );
    };

    return (
      <Modal
        includeDefaultStyles={false}
        getApplicationNode={() => document.querySelector(`#${applicationId}`)}
        onExit={onClose}
        focusDialog={true}
        titleId="cui-lightbox"
        dialogClass="cui-lightbox"
        underlayClass="cui-lightbox__container"
      >
        <div className="cui-lightbox__header" ref={ref => this.lightBox = ref}>
          <div className="cui-lightbox__header-item--left">
            <div className="cui-lightbox__header-meta">
              <div className="cui-lightbox__header-sharer">
                {info.sharedBy}
              </div>
              <div className="cui-lightbox__header-timestamp">
                {info.sharedOn}
              </div>
            </div>
          </div>
          <div className="cui-lightbox__header-item--center">
            <div className="cui-lightbox__header-name">
              {name}
            </div>
          </div>
          <div className="cui-lightbox__header-item--right">
            <Tooltip tooltip={tooltips.exit} direction="bottom-right">
              <div className="cui-lightbox__control"
                onClick={onClose}
                role="button"
                tabIndex="0"
                onKeyPress={onClose}>
                  <Icon name="cancel_16"/>
              </div>
            </Tooltip>
          </div>
        </div>
        <div className="cui-lightbox__body">
          {showColumn && getThumbnails()}
          <div
            className="cui-lightbox__content"
            onClick={onClose}
            onKeyPress={onClose}
            role="button"
            tabIndex="0"
          >
            <div
              className={
                `cui-lightbox__viewport` +
                `${(!!currentPage.decrypting && ` cui-lightbox__viewport--decrypting`) || ''}`
              }
              ref={ref => this.viewport = ref}
            >
              {
                pages[index].decrypting &&
                <Spinner className="cui-lightbox__decrypting-spinner" />
              }
              {getViewport()}
            </div>
            {showColumn && leftArrowControl}
            {showColumn && rightArrowControl}
            {viewportControls()}
          </div>
        </div>
      </Modal>
    );
  }
}

Lightbox.propTypes = {
  downloading: PropTypes.bool,
  height: PropTypes.number.isRequired,
  index: PropTypes.number,
  info: PropTypes.shape({
    sharedBy: PropTypes.string,
    sharedOn: PropTypes.string,
    size: PropTypes.string
  }),
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  onClose: PropTypes.func,
  onDownload: PropTypes.func,
  pages: PropTypes.array.isRequired,
  tooltips: PropTypes.shape({
    download: PropTypes.string,
    downloading: PropTypes.string,
    exit: PropTypes.string,
    previous: PropTypes.string,
    next: PropTypes.string,
    zoomIn: PropTypes.string,
    zoomOut: PropTypes.string
  }),
  width: PropTypes.number.isRequired,
  applicationId: PropTypes.string.isRequired,
};

Lightbox.defaultProps = {
  decrypting: false,
  downloading: false,
  index: 0,
  info: {},
  name: '',
  onChange: () => {},
  onClose: () => {},
  onDownload: () => {},
  tooltips: {
    download: 'Download',
    downloading: 'Downloading...',
    exit: 'Exit',
    previous: 'Previous',
    next: 'Next',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out'
  },
};

/**
* @name Lightbox with one page
*
* @category containers
* @component lightbox
* @section default
*
* @js

import reactIcon from '@collab-ui/core/docs/assets/react.png';

 export default class Default extends React.Component {

  state = {
    index: 0,
    show: false,
    downloading: false,
  }

  render() {
    return (
      <div>
        <button onClick={() => this.setState({ show: true })}>Show</button>
        {
          this.state.show &&
          <Lightbox
            onClose={() => this.setState({ show: false})}
            onChange={(idx) => this.setState({ index: idx })}
            name="Screen Shot 2018-04-11 at 7.32.51 PM.png"
            applicationId="app"
            onDownload={() => {
                this.setState({downloading: true});
                setTimeout(() => this.setState({downloading: false}), 2000);
              }
            }
            downloading={this.state.downloading}
            info={{sharedBy:"Shared by test", sharedOn: "At 4/17/2018, 10:02 AM", size: "34.4 KB"}}
            index={this.state.index}
            height={250}
            width={250}
            pages={[{
              decrypting: false,
              image: reactIcon,
              thumb: reactIcon
            }]}
          />
        }
      </div>
    );
  }
}
**/

/**
* @name Lightbox with multiple page
*
* @category containers
* @component lightbox
* @section multiple
*
* @js

import reactIcon from '@collab-ui/core/docs/assets/react.png';
import angularIcon from '@collab-ui/core/docs/assets/angular.png';

 export default class Default extends React.Component {

  state = {
    index: 0,
    show: false,
    downloading: false,
  }

  render() {
    return (
      <div>
        <button onClick={() => this.setState({ show: true })}>Show</button>
        {
          this.state.show &&
          <Lightbox
            onClose={() => this.setState({ show: false})}
            onChange={(idx) => this.setState({ index: idx })}
            name="Screen Shot 2018-04-11 at 7.32.51 PM.png"
            applicationId="app"
            onDownload={() => {
                this.setState({downloading: true});
                setTimeout(() => this.setState({downloading: false}), 2000);
              }
            }
            downloading={this.state.downloading}
            info={{sharedBy:"Shared by test", sharedOn: "At 4/17/2018, 10:02 AM", size: "34.4 KB"}}
            index={this.state.index}
            height={250}
            width={250}
            pages={[{
              decrypting: false,
              image: reactIcon,
              thumb: reactIcon
            }, {
              decrypting: false,
              image: angularIcon,
              thumb: angularIcon
            }]}
          />
        }
      </div>
    );
  }
}
**/
