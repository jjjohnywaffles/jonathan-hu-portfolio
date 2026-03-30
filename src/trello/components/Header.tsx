import React, { memo } from 'react';
import { SearchBar } from './SearchBar';
import { IconTrelloLogo } from './icons/header/icon-trello-logo';
import { IconMoreFromAtlassian } from './icons/header/icon-more-from-atlassian';
import { IconHeaderInformation } from './icons/header/icon-header-information';
import { IconHeaderNotification } from './icons/header/icon-header-notification';
import { IconThoughts } from './icons/header/icon-thoughts';
import { FlexContainer, IconButton } from './ui';
import { useCurrentUser } from '@trello/_lib/selectors';
import { getTrelloBrandName } from '@trello/_lib/utils/brand';
import { getUserInitials } from '@trello/utils/user-initials';

const Header: React.FC = memo(function Header() {
  const currentUser = useCurrentUser();

  return (
    <header className="flex h-14 items-center bg-white px-2">
      {/* Left: Atlassian Menu and Trello Logo */}
      <FlexContainer className="mr-9">
        <IconButton variant="ghost" size="sm" className="mr-1 h-8 w-8 text-gray-600">
          <IconMoreFromAtlassian className="h-4 w-4" />
        </IconButton>
        <button className="flex items-center rounded px-2 py-1 transition-colors hover:bg-gray-200">
          <IconTrelloLogo className="h-6 w-auto" showText={false} />
          <span className="ml-2 text-lg font-semibold tracking-tight text-gray-800">
            {getTrelloBrandName()}
          </span>
        </button>
      </FlexContainer>
      {/* Center: SearchBar component */}
      <FlexContainer className="flex-1" justify="center" gap="1">
        <SearchBar />
      </FlexContainer>
      {/* Right: Actions and Avatar */}
      <FlexContainer className="ml-4">
        {/* Thoughts icon */}
        <IconButton variant="ghost" size="sm" className="matrices-disabled h-8 w-8">
          <IconThoughts className="h-4 w-4" />
        </IconButton>
        {/* Notification icon */}
        <IconButton variant="ghost" size="sm" className="matrices-disabled h-8 w-8">
          <IconHeaderNotification className="h-4 w-4" />
        </IconButton>
        {/* Information icon */}
        <IconButton variant="ghost" size="sm" className="matrices-disabled h-8 w-8">
          <IconHeaderInformation className="h-5 w-5" />
        </IconButton>
        {/* User avatar */}
        <div className="ml-2">
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.displayName}
              className="h-7 w-7 cursor-pointer rounded-full transition-transform hover:scale-110"
              title={currentUser.displayName}
            />
          ) : (
            <div className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-gray-400 transition-colors hover:bg-gray-500">
              <span className="text-xs font-medium text-white">
                {getUserInitials(currentUser.displayName)}
              </span>
            </div>
          )}
        </div>
      </FlexContainer>
    </header>
  );
});

export { Header };
