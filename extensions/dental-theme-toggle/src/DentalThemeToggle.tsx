import React, { useState, useEffect } from 'react';
import { Switch, Label, Icons } from '@ohif/ui-next';

/**
 * DentalThemeToggle Component
 * Provides a toggle switch to change between OHIF theme and Dental theme
 *
 * CSS Classes Applied:
 * - .ohif-theme: Standard OHIF blue-themed interface
 * - .dental-theme: Dental-optimized emerald/teal themed interface
 */
const DentalThemeToggle = ({ servicesManager }) => {
  const [isDentalTheme, setIsDentalTheme] = useState(false);

  // Function to get current theme from localStorage
  const getCurrentTheme = () => {
    const savedTheme = localStorage.getItem('viewerTheme');
    return savedTheme === 'dental' || !savedTheme || savedTheme === '';
  };

  // Initialize theme state and apply theme on mount
  useEffect(() => {
    const shouldDefaultToDental = getCurrentTheme();

    // Set localStorage to dental if it's empty or not set
    const savedTheme = localStorage.getItem('viewerTheme');
    if (!savedTheme || savedTheme === '') {
      localStorage.setItem('viewerTheme', 'dental');
    }

    setIsDentalTheme(shouldDefaultToDental);
    applyTheme(shouldDefaultToDental);

    // Listen for localStorage changes to sync across components
    const handleStorageChange = e => {
      if (e.key === 'viewerTheme') {
        const newTheme = getCurrentTheme();
        setIsDentalTheme(newTheme);
        applyTheme(newTheme);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for manual localStorage changes within the same tab
    const checkThemeChange = () => {
      const currentTheme = getCurrentTheme();
      if (currentTheme !== isDentalTheme) {
        setIsDentalTheme(currentTheme);
      }
    };

    const interval = setInterval(checkThemeChange, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Apply theme when state changes
  useEffect(() => {
    applyTheme(isDentalTheme);
  }, [isDentalTheme]);

  const applyTheme = isDental => {
    const rootElement = document.documentElement;

    if (isDental) {
      rootElement.classList.add('dental-theme');
      rootElement.classList.remove('ohif-theme');
    } else {
      rootElement.classList.add('ohif-theme');
      rootElement.classList.remove('dental-theme');
    }
  };

  const handleThemeToggle = checked => {
    setIsDentalTheme(checked);
    localStorage.setItem('viewerTheme', checked ? 'dental' : 'ohif');
    applyTheme(checked);

    // Optionally notify other parts of the application
    if (servicesManager?.services?.uiNotificationService) {
      const themeName = checked ? 'Dental' : 'OHIF';
      servicesManager.services.uiNotificationService.show({
        title: 'Theme Changed',
        message: `Switched to ${themeName} theme`,
        type: 'info',
        duration: 2000,
      });
    }
  };

  return (
    <div className="bg-primary-dark flex flex-col space-y-4 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Icons.Settings className="text-primary-light h-5 w-5" />
        <h3 className="text-primary-light text-base font-semibold">Viewer Theme</h3>
      </div>

      {/* Theme Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <Label
            htmlFor="theme-toggle"
            className="text-foreground mb-1 text-sm font-medium"
          >
            {isDentalTheme ? 'Dental Theme' : 'OHIF Theme'}
          </Label>
          <span className="text-foreground/60 text-xs">
            {isDentalTheme
              ? 'Optimized for dental imaging workflows'
              : 'Standard OHIF viewer interface'}
          </span>
        </div>

        <Switch
          id="theme-toggle"
          checked={isDentalTheme}
          onCheckedChange={handleThemeToggle}
          aria-label="Toggle viewer theme"
        />
      </div>

      {/* Theme Preview */}
      <div className="bg-muted flex items-center justify-center space-x-2 rounded p-3">
        <div
          className={`h-8 w-8 rounded-full transition-all ${
            isDentalTheme ? 'bg-emerald-600' : 'bg-blue-600'
          }`}
          title="Primary color"
        />
        <div
          className={`h-8 w-8 rounded-full transition-all ${
            isDentalTheme ? 'bg-teal-500' : 'bg-indigo-500'
          }`}
          title="Accent color"
        />
        <div
          className={`h-8 w-8 rounded-full transition-all ${
            isDentalTheme ? 'bg-cyan-400' : 'bg-purple-400'
          }`}
          title="Highlight color"
        />
      </div>

      {/* Additional Info */}
      <div className="border-primary/20 text-foreground/70 border-t pt-3 text-xs">
        <p>Theme preference is saved automatically and will persist across sessions.</p>
      </div>
    </div>
  );
};

export default DentalThemeToggle;
