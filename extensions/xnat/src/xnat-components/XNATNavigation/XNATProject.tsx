import React from 'react';
import XNATSubjectList from './XNATSubjectList';
import fetchJSON from '../../utils/IO/fetchJSON';
import onExpandIconClick from './helpers/onExpandIconClick';
import getExpandIcon from './helpers/getExpandIcon';
import compareOnProperty from './helpers/compareOnProperty';
import sessionMap from '../../utils/sessionMap';

import '../XNATNavigationPanel.css';

interface Subject {
  ID: string;
  label: string;
  project: string;
  [key: string]: any;
}

interface XNATProjectProps {
  ID: string;
  name: string;
}

interface XNATProjectState {
  subjects: Subject[];
  active: boolean;
  expanded: boolean;
  fetched: boolean;
}

// Define interfaces for child components
interface XNATSubjectListProps {
  projectId: string;
  subjects: Subject[];
  fetched: boolean;
}

export default class XNATProject extends React.Component<XNATProjectProps, XNATProjectState> {
  private _cancelablePromise: any;
  getExpandIcon: () => JSX.Element;
  onExpandIconClick: () => void;

  constructor(props: XNATProjectProps) {
    super(props);
    console.log('XNATProject: Constructor called with props:', props);

    const active = this.props.ID === sessionMap.getProject();
    console.log('XNATProject: Active state:', active, 'Project ID:', this.props.ID, 'Session Project ID:', sessionMap.getProject());

    this.state = {
      subjects: [],
      active,
      expanded: false,
      fetched: false,
    };

    // Bind helper methods
    this.getExpandIcon = getExpandIcon.bind(this);
    this.onExpandIconClick = onExpandIconClick.bind(this);
    
    // Debug the bound methods
    console.log('XNATProject: Bound methods:', {
      getExpandIcon: typeof this.getExpandIcon,
      onExpandIconClick: typeof this.onExpandIconClick
    });
  }

  componentWillUnmount(): void {
    if (this._cancelablePromise) {
      this._cancelablePromise.cancel();
    }
  }

  /**
   * fetchData - Fetch this project's list of subjects from from XNAT.
   *
   * @returns {null}
   */
  fetchData(): void {
    console.log('XNATProject: Fetching subjects for project:', this.props.ID);
    
    this._cancelablePromise = fetchJSON(
      `data/archive/projects/${this.props.ID}/subjects?format=json`
    );

    this._cancelablePromise.promise
      .then((result: any) => {
        console.log('XNATProject: Subject data received:', result);
        
        if (!result) {
          console.error('XNATProject: No subject data returned from API');
          return;
        }

        const subjects: Subject[] = result.ResultSet.Result;
        console.log('XNATProject: Retrieved subjects:', subjects);

        subjects.sort((a, b) => compareOnProperty(a, b, 'label'));

        this.setState({
          subjects,
          fetched: true,
        });
      })
      .catch((err: Error) => {
        console.error('XNATProject: Error fetching subjects:', err);
      });
  }

  render(): React.ReactNode {
    console.log('XNATProject: Rendering with state:', this.state);
    
    const { ID, name } = this.props;
    const { subjects, active, fetched, expanded } = this.state;

    return (
      <React.Fragment>
        <div className="xnat-nav-horizontal-box">
          <a
            className="btn btn-sm btn-secondary xnat-nav-button"
            onClick={() => {
              console.log('XNATProject: Expand icon clicked');
              this.onExpandIconClick();
            }}
            style={{ flexShrink: 0 }}
          >
            {(() => {
              console.log('XNATProject: Rendering expand icon');
              try {
                return this.getExpandIcon();
              } catch (err) {
                console.error('XNATProject: Error rendering expand icon:', err);
                return <span>▶</span>;
              }
            })()}
          </a>
          <div>
            {active ? <h5 className="xnat-nav-active">{name}</h5> : <h5>{name}</h5>}
          </div>
        </div>
        {expanded ? (
          <XNATSubjectList
            projectId={ID}
            subjects={subjects}
            fetched={fetched}
          />
        ) : null}
      </React.Fragment>
    );
  }
} 