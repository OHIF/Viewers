import React, { useState } from "react";
import "./header.css";
import { UserOutlined } from "@ant-design/icons";
import { Avatar, Dropdown, Space, Menu } from "antd";
import myImage from './yashoda-logo.png';

const AppHeader = () => {
  const userId = localStorage.getItem("user_id");
  const userToken = localStorage.getItem("access_token");

  const items = [
    {
      key: "1",
      label: <a>Logout</a>,
    },
  ];

  return (
    <div className="header-container">
      <div className="logo">
        <img src={myImage} alt="Header" />
      </div>
      <div className="hospital-name">
        <span className="user-name">TEST USER</span>
      </div>
      <div className="profile">
        <Dropdown menu={{ items }}>
          <a onClick={(e) => e.preventDefault()}>
            <Space>
              {userId ? <Avatar icon={<UserOutlined />} /> : null}
            </Space>
          </a>
        </Dropdown>
      </div>
    </div>
  );
};

export default AppHeader;
