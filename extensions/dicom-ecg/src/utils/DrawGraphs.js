import c3 from 'c3';
import graphicCalibration from '../constants/graphicCalibration';

/**
 * Render Draw Graphs ECG.
 */
class DrawGraphs {
  /**
   *
   * @param {Data ECG} dataMg
   * @param {Viewport Index} index
   */
  constructor(dataMg, index) {
    this.dataMg = dataMg;
    this.index = index;
  }

  /**
   * Draw data.
   */
  async draw() {
    //Loader:
    await this.drawLoader();
    //Draw DOM Divs:
    this.addDOMChart();
    //Draw line:
    this.drawLine();
  }

  //No compatible ECG
  noCompatible() {
    let id = 'myWaveform' + this.index;
    this.removeLoader();
    document.getElementById(id).innerHTML =
      '<h1 style="vertical-align: center;text-align: center;">ECG NO COMPATIBLE</h1>';
  }

  /**
   * Draw loader.
   */
  async drawLoader() {
    let id = 'myWaveform' + this.index;
    document.getElementById(id).innerHTML = '<div class="loader"></div>'; //Clear
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * Remove loader.
   */
  removeLoader() {
    let load = Array.from(document.getElementsByClassName('loader'));
    load.forEach(element => {
      element.remove();
    });
  }

  /**
   * Load ECG divs:
   * @param {Viewer Number} chartId
   * @param {Chanel Number} index
   */
  addDOMChart() {
    //For number of channels:
    for (
      let numChannel = 0;
      numChannel < this.dataMg.numberOfWaveformChannels;
      numChannel++
    ) {
      let chartId = 'myChart_' + this.index + numChannel;
      if (
        document.getElementById(chartId) == null ||
        document.getElementById(chartId) == undefined
      ) {
        let id = 'myWaveform' + this.index;
        document.getElementById(id).innerHTML +=
          '<div id="' + chartId + '"></div>';
      }
    }
  }

  /**
   * Draw line.
   */
  drawLine() {
    try {
      // *** ToDo:
      // Automatic selection of units range depending on max / min values ??''
      // Automatic selection depending on SOP Class UID ?
      for (
        let numChannel = 0;
        numChannel < this.dataMg.numberOfWaveformChannels;
        numChannel++
      ) {
        var chartId = 'myChart_' + this.index + numChannel;
        let yAxis = {};

        switch (
          this.dataMg.channels[numChannel].channelDefinition
            .channelSensitivityUnits.codeValue
        ) {
          case 'uV':
            yAxis.min = graphicCalibration.uV.min;
            yAxis.max = graphicCalibration.uV.max;
            yAxis.deltaMain = graphicCalibration.uV.deltaMain;
            yAxis.deltaSecondary = graphicCalibration.uV.deltaSecondary;
            break;

          case 'mV':
            // *** ToDo: proper rounding of values in y axis
            yAxis.min = graphicCalibration.mV.min;
            yAxis.max = graphicCalibration.mV.max;
            yAxis.deltaMain = graphicCalibration.mV.deltaMain;
            yAxis.deltaSecondary = graphicCalibration.mV.deltaSecondary;
            break;

          case 'mm[Hg]': // Better 60 ~ 160 range ?
            yAxis.min = graphicCalibration.mmHg.min;
            yAxis.max = graphicCalibration.mmHg.max;
            yAxis.deltaMain = graphicCalibration.mmHg.deltaMain;
            yAxis.deltaSecondary = graphicCalibration.mmHg.deltaSecondary;
            break;

          default:
            yAxis.min = -500;
            yAxis.max = 1500;
            yAxis.deltaMain = 500;
            yAxis.deltaSecondary = 100;
        }

        yAxis.label =
          this.dataMg.channels[numChannel].channelDefinition
            .channelSensitivityUnits.codeMeaning +
          ' (' +
          this.dataMg.channels[numChannel].channelDefinition
            .channelSensitivityUnits.codeValue +
          ')';

        //Draw line:
        this.bindChart(chartId, this.dataMg.channels[numChannel], yAxis);
      }
    } catch (err) {
      throw err;
    } finally {
      this.removeLoader();
    }
  }

  /**
   * Draw line graphs with chars.
   * @param {*} chartId Div Id render data.
   * @param {*} channelData Chanel Data.
   * @param {*} yAxis Data graphic.
   */
  bindChart(chartId, channelData, yAxis) {
    //console.log(yAxis);
    var samples = channelData.samples;
    var codeMeaning = channelData.channelDefinition.channelSource.codeMeaning;
    //var yMax = 1500;
    //var yMin = -500;
    //var yMax = 2.0;
    //var yMin = -0.4;
    //var deltaYSecondary = 100;
    //var deltaYMain = 500;
    var xMin = 0;
    var xMax = samples.length;
    var deltaX = 40;
    var deltaX2 = 200;

    var params = {
      bindto: '#' + chartId,
      data: {
        columns: [[codeMeaning]],
      },
      /*zoom: {
        enabled: true,
      },
      subchart: {
        show: true,
      },*/
      point: {
        show: false,
      },
      transition: {
        duration: 0,
      },
      axis: {
        x: {
          tick: {
            count: 1,
          },
        },
        y: {
          max: yAxis.max,
          min: yAxis.min,
          label: {
            text: yAxis.label,
            position: 'outer-middle',
          },
          tick: {
            values: [],
          },
        },
      },
      grid: {
        //40(200) ms, 40(200) uV ?
        x: {
          lines: [],
        },
        y: {
          lines: [],
        },
      },
    };

    params.data.columns[0] = params.data.columns[0].concat(samples);

    for (let y = yAxis.min; y <= yAxis.max; y += yAxis.deltaSecondary) {
      params.grid.y.lines.push({ value: y });
    }

    for (let y = yAxis.min; y <= yAxis.max; y += yAxis.deltaMain) {
      params.grid.y.lines.push({ value: y });
      params.axis.y.tick.values.push(y);
    }

    for (let x = xMin; x <= xMax; x += deltaX) {
      params.grid.x.lines.push({ value: x });
    }

    for (let x = xMin; x <= xMax; x += deltaX2) {
      params.grid.x.lines.push({ value: x });
    }

    //Generate with c3:
    c3.generate(params);
  }
}
export default DrawGraphs;
