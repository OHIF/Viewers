import { Tag } from "antd";
import React from "react";
import { FileTextOutlined } from '@ant-design/icons';

const statusColors = {
  'PENDING': 'red',
  'REPORT_DRAFTED': 'orange',
  'REPORT_SUBMITTED': 'yellow',
  'REPORT_SIGNEDOFF': 'green',
};

export const orderColumns = (openReportEditor) => ([
  {
    dataIndex: "po_pat_name",
    title: "Patient Name",
  },
  {
    dataIndex: "po_diag_desc",
    title: "Diag Name",
  },
  {
    dataIndex: "po_ord_no",
    title: "Order No",
  },
  {
    dataIndex: "po_ref_doc",
    title: "Ref Doc",
  },
  {
    dataIndex: "po_status",
    title: "Status",
    render: (text, record) => {
      return (
        <>
          <Tag color={statusColors[text]}>{text.replaceAll('_', ' ')}</Tag>
          {record.po_status !== 'PENDING' && (
            <span className="pointer md-icon" onClick={() => openReportEditor(record)}>
              <FileTextOutlined />
            </span>
          )}
        </>
      )
    }
  }
]);
