import Protocol from '../classes/Protocol';
import ViewportStructure from '../classes/ViewportStructure';
import Viewport from '../classes/Viewport';
import Stage from '../classes/Stage';

function getDefaultProtocol() {
  const protocol = new Protocol('Default');
  protocol.id = 'defaultProtocol';
  protocol.locked = true;

  const oneByOne = new ViewportStructure('grid', {
    Rows: 1,
    Columns: 1,
  });

  const viewport = new Viewport();
  const first = new Stage(oneByOne, 'oneByOne');
  first.viewports.push(viewport);

  protocol.stages.push(first);

  return protocol;
}

const defaultProtocol = getDefaultProtocol();

export default defaultProtocol;
