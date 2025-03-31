export default function onExpandIconClick() {
  console.log('onExpandIconClick: Called with current state:', this.state);
  
  const expanded = !this.state.expanded;
  console.log('onExpandIconClick: Toggling expanded state to:', expanded);

  if (expanded && !this.state.fetched) {
    console.log('onExpandIconClick: First expansion, fetching data');
    if (typeof this.fetchData === 'function') {
      this.fetchData();
    } else {
      console.error('onExpandIconClick: fetchData method is not available on this component:', this);
    }
  }

  console.log('onExpandIconClick: Setting new state with expanded =', expanded);
  this.setState({ expanded });
}
