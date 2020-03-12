/** @jsx jsx */
import { jsx, Box, Flex, useColorMode } from 'theme-ui';
import { useConfig, useCurrentDoc } from 'docz';

import * as styles from 'gatsby-theme-docz/src/components/Header/styles';
import {
  Edit,
  Menu,
  Sun,
  Github,
} from 'gatsby-theme-docz/src/components/Icons';
import { Logo } from 'gatsby-theme-docz/src/components/Logo';

export const Header = props => {
  const { onOpen } = props;
  const {
    repository,
    themeConfig: { showDarkModeSwitch, showMarkdownEditButton },
  } = useConfig();
  const { edit = true, ...doc } = useCurrentDoc();
  const [colorMode, setColorMode] = useColorMode();

  const toggleColorMode = () => {
    setColorMode(colorMode === 'light' ? 'dark' : 'light');
  };

  return (
    <div sx={styles.wrapper} data-testid="header">
      <div sx={styles.innerContainer}>
        <div className="flex">
          <button className="mr-4" sx={styles.menuButton} onClick={onOpen}>
            <Menu size={25} />
          </button>
          <Logo />
        </div>
        <Flex>
          {repository && (
            <Box sx={{ mr: 2 }}>
              <a
                href={repository}
                sx={styles.headerButton}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github size={15} />
              </a>
            </Box>
          )}
          {showDarkModeSwitch && (
            <button sx={styles.headerButton} onClick={toggleColorMode}>
              <Sun size={15} />
            </button>
          )}
        </Flex>
        {showMarkdownEditButton && edit && doc.link && (
          <a
            sx={styles.editButton}
            href={doc.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Edit width={14} />
            <Box sx={{ pl: 2 }}>Edit page</Box>
          </a>
        )}
      </div>
    </div>
  );
};
