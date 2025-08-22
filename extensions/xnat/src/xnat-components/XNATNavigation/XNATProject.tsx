import React from 'react';
import XNATSubjectList from './XNATSubjectList';
import fetchJSON from '../../utils/IO/fetchJSON';
import onExpandIconClick from './helpers/onExpandIconClick';
import getExpandIcon from './helpers/getExpandIcon';
import compareOnProperty from './helpers/compareOnProperty';
import sessionMap from '../../utils/sessionMap';

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

    const active = this.props.ID === sessionMap.getProject();

    this.state = {
      subjects: [],
      active,
      expanded: false,
      fetched: false,
    };

    // Bind helper methods
    this.getExpandIcon = getExpandIcon.bind(this);
    this.onExpandIconClick = onExpandIconClick.bind(this);
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
    
    this._cancelablePromise = fetchJSON(
      `data/archive/projects/${this.props.ID}/subjects?format=json`
    );

    this._cancelablePromise.promise
      .then((result: any) => {
        
        if (!result) {
          console.error('XNATProject: No subject data returned from API');
          return;
        }

        const subjects: Subject[] = result.ResultSet.Result;

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
    
    const { ID, name } = this.props;
    const { subjects, active, fetched, expanded } = this.state;

    return (
      <React.Fragment>
        <div className="flex items-center space-x-2 p-2 hover:bg-accent/50 rounded cursor-pointer">
          <button
            className="flex-shrink-0 p-1 hover:bg-accent rounded"
            onClick={() => {
              this.onExpandIconClick();
            }}
          >
            {(() => {
              try {
                return this.getExpandIcon();
              } catch (err) {
                console.error('XNATProject: Error rendering expand icon:', err);
                return <span>▶</span>;
              }
            })()}
          </button>
          <div className="flex-1">
            {active ? (
              <h5 className="text-sm font-medium text-primary">{name}</h5>
            ) : (
              <h5 className="text-sm">{name}</h5>
            )}
          </div>
        </div>
        {expanded ? (
          <div className="ml-4 border-l border-border pl-4">
            <XNATSubjectList
              projectId={ID}
              subjects={subjects}
              fetched={fetched}
            />
          </div>
        ) : null}
      </React.Fragment>
    );
  }
} 