import { Table } from 'antd';
import React, { useEffect, useState } from 'react';
import { orderColumns } from './constants';

const OrdersList = () => {

  const [orders, setOrders] = useState({ data: [], loading: true });

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

  return (
    <div className='orders-list'>
      <Table columns={orderColumns} dataSource={orders.data || []} />
    </div>
  );
}

export default OrdersList;