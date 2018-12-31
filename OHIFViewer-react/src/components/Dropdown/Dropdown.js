import React, { Component } from 'react'
import PropTypes from "prop-types";
import './Dropdown.css'

class Dropdown extends Component {
  state = {
    open: false
  }

  renderList = () => {
    const { list, align } = this.props

    if (!this.state.open) {
      return null
    }

    return (
      <div className={`dd-menu-list ${align || 'left'}`}>
        {
          list.map(({ icon, title, link, onClick }, key) => (
            <a
              href={link || "#"}
              key={key}
              className='dd-item'
              onClick={() => this.handleOnClick(onClick)}
            >
              {icon && <span className={`dd-item-icon ${icon}`}></span>}
              <span>{title}</span>
            </a>
          ))
        }
      </div>
    )
  }

  handleOnClick = (onClick) => {
    this.toggleList()

    if (onClick) {
      onClick()
    }
  }

  handleMouseClick = (e) => {
    if (this.node.contains(e.target)) {
      return
    }

    this.toggleList()
  }

  renderTitleElement = () => {
    const { titleElement, title } = this.props

    if (titleElement) return titleElement

    return (
      <>
        <span className="dd-title">{title}</span>
        <span className="dd-caret-down"></span>
      </>
    )
  }

  toggleList = () => {
    const { open } = this.state
    let state = true

    document.addEventListener('mousedown', this.handleMouseClick, false)

    if (open) {
      document.removeEventListener('mousedown', this.handleMouseClick, false)
      state = false
    }

    this.setState({
      open: state
    })

  }

  render() {
    return (
      <div className='dd-menu' ref={node => this.node = node}>
        <div className="dd-menu-toggle" onClick={this.toggleList}>
          {this.renderTitleElement()}
        </div>

        {this.renderList()}
      </div >
    )
  }
}

Dropdown.propTypes = {
  titleElement: PropTypes.node,
  align: PropTypes.oneOf(['left', 'center', 'right']),
  list: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string.isRequired,
    icon: PropTypes.string,
    onClick: PropTypes.func,
    link: PropTypes.string,
  }))
};

export default Dropdown
