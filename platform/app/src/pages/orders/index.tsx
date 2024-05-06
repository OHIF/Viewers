import { Modal, Table } from 'antd';
import React, { useEffect, useState } from 'react';
import { orderColumns } from './constants';
import ReportEditor from '../ReportEditor';

const OrdersList = () => {

  const [orders, setOrders] = useState({ data: [], loading: true });
  const [reportEditorModal, setReportEditorModal] = useState({ visible: false, data: {} });

  useEffect(() => {
    getOrdersList();
  }, []);

  const onSave = (newContent) => {
    console.log("onsave newContent", reportEditorModal);
    fetch('http://localhost:4000/submit-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        html: newContent,
        yh_no: reportEditorModal.data?.po_pin,
        order_no: reportEditorModal.data?.po_ord_no,
        acc_no: reportEditorModal.data?.po_acc_no,
        user_id: "test_user"
      })
    })
      .then(res => res.json())
      .then(res => {
        console.log("resp", res);
      })
      .catch(e => {
        console.log(e);
      });
  }


  const getOrdersList = async () => {
    fetch('http://localhost:4000/orders')
      .then(res => res.json())
      .then(res => {
        console.log("resp", res);
        setOrders({ data: res.data, loading: false })
      })
      .catch(e => {
        console.log(e);
        setOrders({ data: [], loading: false })
      });
  }

  const cancelReport = () => {
    console.log("cancel report");
    setReportEditorModal({ visible: false, data: {} });
  }

  return (
    <div className='orders-list'>
      <Table columns={orderColumns} dataSource={orders.data || []} onRow={(record, rowIndex) => {
        return {
          onClick: () => {
            console.log("on row click", record, rowIndex);

            setReportEditorModal({ visible: true, data: record });
          }
        }
      }} />
      {reportEditorModal.visible && (
        <Modal className='report-modal' width={'100%'} onCancel={() => { setReportEditorModal({ visible: false }) }} footer={null} open={reportEditorModal.visible}>
          <ReportEditor cancel={cancelReport} onSave={onSave} patientDetails={reportEditorModal.data} />
        </Modal>
      )}
    </div>
  );
}

export default OrdersList;
