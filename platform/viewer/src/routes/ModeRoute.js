export default function ModeRoute(mode, dataSourceId) {
  const [displaySets, setDisplaySets] = useState([]);
  const { routes, sopClassHandlers, extensions } = getMode(modeId);

  // Deal with toolbar.

  // Only handling one route per mode for now
  const LayoutComponent = routes[0].layoutTemplate;

  // Add SOPClassHandlers to a new SOPClassManager.
  const manager = new SOPClassHandlerManager(sopClassHandlers);

  const dataSource = getDataSource(dataSourceId);
  const queryParams = location.search;

  // Call the data source to start building the view model?
  dataSource(queryParams);

  metadataStore.onModified();

  const onUpdatedCallback = () => {
    // TODO: This should append, not create from scratch so we don't nuke existing display sets
    // when e.g. a new series arrives
    manager.createDisplaySets.then(setDisplaySets);
  };

  // TODO: Should extensions provide an array of these or one nested context?
  const contextModules = extensions.getContextModules();
  const ExtensionContexts = contextModules => {};

  /*
  TODO: How are contexts provided by extensions passed into the mode?

  return (
    <ExtensionContexts>
      <LayoutComponent displaySets={displaySets} setDisplaySets={setDisplaySets}/>
    </ExtensionContexts>
  );*/

  return <LayoutComponent displaySetInstanceUids={displaySetInstanceUids} />;
}

/*const ViewModelContext = React.createContext(
  displaySets: [],
  setDisplaySets: () => {}
);


class ViewModelProvider extends Component {
  state = {
    displaySets: []
  };

  const setDisplaySets = displaySets => {
    this.setState({displaySets});
  };

  render() {
    return (
      <ViewModelContext.Provider value={
        displaySets: this.state.displaySets,
        setDisplaySets
      }>
        {this.props.children}
      </ViewModelContext.Provider>
    );
  }
}*/
