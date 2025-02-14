export default function onExpandIconClick() {
  const expanded = !this.state.expanded;

  if (expanded && !this.state.fetched) {
    this.fetchData();
  }

  this.setState({ expanded });
}
