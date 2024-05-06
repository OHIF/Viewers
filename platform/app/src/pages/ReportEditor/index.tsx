import React, { useEffect } from "react";
import RichTextEditor from "./rich-text-editor";
import "./editor.css";
import { ConvertStringToDate } from "../../utils/helper";
import moment from "moment";
import { Checkbox, Radio, Select, Table } from "antd";
import { TemplateHeader } from "./constants";
import TinyMceEditor from "./tinymce";
import TinymceEditor from "./tinymce";

const ReportEditor = ({ cancel, onSave, patientDetails }) => {
  const [content, setContent] = React.useState(null);
  const [reportsData, setReportsData] = React.useState([]);
  const [currentReport, setCurrentReport] = React.useState(null);
  const [templates, setTemplates] = React.useState([]);
  const [selectedNode, setSelectedNode] = React.useState(null);

  const handleContentChange = (newContent) => {
    // console.log("newContent", newContent);
    // setContent(newContent);
  }

  console.log("patientDetails", patientDetails);

  useEffect(() => {
    fetchPrevReports();
    getTemplates();
  }, []);

  const fetchPrevReports = () => {
    fetch('http://localhost:4000/get-reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        yh_no: patientDetails?.po_pin,
        order_no: patientDetails?.po_ord_no,
        acc_no: patientDetails?.po_acc_no,
      })
    })
      .then(res => res.json())
      .then(res => {
        console.log("resp", res);
        setReportsData(res?.data);
        setCurrentReport(res?.data[0]);

      })
      .catch(e => {
        console.log(e);
      })
  }

  const getTemplates = () => {
    fetch('http://localhost:4000/get-templates', {
      method: 'GET',
    })
      .then(res => res.json())
      .then(res => {
        console.log("templ", res);
        setTemplates(res?.data);
      })
      .catch(e => {
        console.log(e);
      })
  }

  useEffect(() => {
    if (currentReport) {
      setContent(`${TemplateHeader()}${currentReport?.pr_html}`);
    }
  }, [currentReport]);

  console.log("templates", templates);

  const reportColumns = [
    {
      title: 'Created By',
      dataIndex: 'pr_created_by',
      key: 'pr_created_by',
    },
    {
      title: 'Created Date',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: 'Status',
      dataIndex: 'pr_status',
      key: 'pr_status',
    },
    {
      title: '',
      key: 'actions'
    }
  ];

  return (
    <div className="editor-container">
      <div className="left-section">
        <div className="patient-details">
          <div className="d-flex">
            <div className="pat-name">
              {`${patientDetails?.po_pat_name}, ${patientDetails?.po_pin}`}
            </div>
          </div>
          <div>
            {`${patientDetails?.po_pat_sex} / ${patientDetails?.po_age}`}
          </div>
          <div>{`${patientDetails?.modality} / ${patientDetails?.po_ref_doc} ,
            ${moment(ConvertStringToDate(patientDetails?.po_study_dt, patientDetails?.po_study_tm)).format("DD-MM-YYYY HH:mm:ss")}`}
          </div>
        </div>
        <div className="previous-reports">
          <Table
            pagination={false}
            columns={reportColumns}
            dataSource={reportsData ? reportsData?.slice(0, 2) : []}
          />

        </div>
        <div className="templates-section">
          <div>Load Template</div>
          <div>
            <span>Node</span>
            <Select options={Object.keys(templates)?.map((itm) => ({ label: itm, value: itm }))} />
            <span>Template</span>
            <Select options={(templates && templates[selectedNode]) ? templates[selectedNode]?.map(itm => ({ label: itm.label, value: itm.template })) : []} />
          </div>
        </div>
        <div className="more-options">
          <div>More Options</div>
          <div><Checkbox /> There is a critical finding. Notify to physician</div>
          <div><Checkbox /> Need peer opinion from</div>
          <div><Checkbox /> Requires Sub-Speciality Opinion</div>
          <div><Checkbox /> Report Co-Signing</div>
          <div><Checkbox /> Proxy Draft</div>
          <div><Checkbox /> Proxy Signoff</div>
          <div>Clinically diagnosed
            <Radio.Group >
              <Radio value={1}>A</Radio>
              <Radio value={2}>B</Radio>
            </Radio.Group>
          </div>
        </div>
      </div>
      <div className="right-section">
        <RichTextEditor cancel={cancel} content={content || "<div></div>"} onSave={onSave} onChange={handleContentChange} />
      </div>
    </div>
  );
};

export default ReportEditor;
