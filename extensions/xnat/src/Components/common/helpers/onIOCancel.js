/**
 * onIOCancel - Helper function for annotation menu components. Sets
 * this.state.importing and this.state.exporting to false.
 *
 * @returns {null}
 */
export default function onIOCancel() {
  this.setState({
    importing: false,
    exporting: false,
  });
}
