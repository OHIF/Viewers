import React, { Component } from 'react';
import PropTypes from 'prop-types';
import stateDetails from './state';

class AISection extends Component {
  state = {
    name: '',
    modality: '',
    organ: '',
    task: '',
    data_description: '',
    model_description: '',
    additional_info: '',
    model_performance: '',
    website: '',
    citation: '',
    version: '',
  };

  handleChange = event => {
    const { value } = event.target;
    const endpoint = `${stateDetails.infoApi}?model_id=${value}`;

    fetch(endpoint)
      .then(response => response.json())
      .then(data => {
        const value_params = data.data;

        this.setState({
          name: value_params.name,
          modality: value_params.modality,
          organ: value_params.organ,
          task: value_params.task,
          data_description: value_params.data_description,
          model_description: value_params.model_description,
          additional_info: value_params.additional_info,
          model_performance: value_params.model_performance,
          website: value_params.website,
          citation: value_params.citation,
          version: value_params.version,
        });
      });
  };

  componentDidMount() {
    const input = document.getElementById('lang');
    const endpoint = `${stateDetails.infoApi}?model_id=${input.value}`;

    fetch(endpoint)
      .then(response => response.json())
      .then(data => {
        const value_params = data.data;

        this.setState({
          name: value_params.name,
          modality: value_params.modality,
          organ: value_params.organ,
          task: value_params.task,
          data_description: value_params.data_description,
          model_description: value_params.model_description,
          additional_info: value_params.additional_info,
          model_performance: value_params.model_performance,
          website: value_params.website,
          citation: value_params.citation,
          version: value_params.version,
        });
      });
  }

  render() {
    return (
      <div id="ai-section-wrapper" className="">
        <form>
          <div className="form-group">
            <label className="form-label" htmlFor="ai-models">
              Available Models
            </label>
            <select
              id="lang"
              className="form-control ai-models js-aiModelName js-option"
              onChange={e => this.handleChange(e)}
            >
              <option value="Java">Java</option>
              <option value="C++">C++</option>
            </select>
          </div>
        </form>
        <br />
        <p className="table-title">Model Specifications</p>
        <div id="ai-model-info">
          <table className="table table-responsive">
            <tbody>
              <tr>
                <td className="text-bold">model name</td>
                <td>{this.state.name}</td>
              </tr>
              <tr>
                <td className="text-bold">organ</td>
                <td>{this.state.organ}</td>
              </tr>
              <tr>
                <td className="text-bold">modality</td>
                <td>{this.state.modality}</td>
              </tr>
              <tr>
                <td className="text-bold">task</td>
                <td>{this.state.task}</td>
              </tr>
              <tr>
                <td className="text-bold">data description</td>
                <td>{this.state.data_description}</td>
              </tr>
              <tr>
                <td className="text-bold">model description</td>
                <td>{this.state.model_description}</td>
              </tr>
              <tr>
                <td className="text-bold">additional info required</td>
                <td>{this.state.additional_info}</td>
              </tr>
              <tr>
                <td className="text-bold">model performance</td>
                <td>{this.state.model_performance}</td>
              </tr>
              <tr>
                <td className="text-bold">website</td>
                <td>{this.state.website}</td>
              </tr>
              <tr>
                <td className="text-bold">citation</td>
                <td>{this.state.citation}</td>
              </tr>
              <tr>
                <td className="text-bold">version</td>
                <td>{this.state.version}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default AISection;
