import { Modal, Table } from 'antd';
import React, { useEffect, useState } from 'react';
import { orderColumns } from './constants';
import ReportEditor from '../ReportEditor';

const OrdersList = () => {

  const [orders, setOrders] = useState({ data: [], loading: true });
  const [reportEditorModal, setReportEditorModal] = useState({ visible: false });

  useEffect(() => {
    getOrdersList();
  }, []);

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
    setReportEditorModal({ visible: false });
  }

  return (
    <div className='orders-list'>
      <Table columns={orderColumns} dataSource={orders.data || []} onRow={(record, rowIndex) => {
        return {
          onClick: () => {
            console.log("on row click", record, rowIndex);

            setReportEditorModal({ visible: true });
          }
        }
      }} />
      {reportEditorModal.visible && (
        <Modal footer={null} open={reportEditorModal.visible}>
          <ReportEditor cancel={cancelReport} />
        </Modal>
      )}
    </div>
  );
}

export default OrdersList;