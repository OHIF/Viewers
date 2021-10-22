import React, { useEffect } from 'react';
import '../AITriggerComponent.css';
import { data } from './Data';
import Jobs from './Jobs';
import { connect } from 'react-redux';

const TextureFeature = props => {
  const { user, viewport } = props;
  useEffect(() => {
    console.log({ user });
  }, []);

  return (
    <div className="component">
      <div className="title-header">Texture Features</div>
      <div className="accordion">
        {data.map(({ title, content }, index) => (
          <Jobs
            key={index}
            user={user}
            viewport={viewport}
            title={title}
            content={content}
          />
        ))}
      </div>
    </div>
  );
};

const mapStateToProps = state => {
  return {
    user: state.oidc.user,
    viewport: state.viewports,
  };
};

const ConnectedTextureFeature = connect(
  mapStateToProps,
  null
)(TextureFeature);

export default ConnectedTextureFeature;
