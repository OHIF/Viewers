import ReactDOM from 'react-dom';
import html2canvas from 'html2canvas';

const exportComponent = node => {
  if (!node.current) {
    throw new Error("'node' must be a RefObject");
  }

  const element = ReactDOM.findDOMNode(node.current);

  return html2canvas(element, {
    scrollY: -window.scrollY,
    allowTaint: false,
    useCORS: true,
  });
};

export default exportComponent;
