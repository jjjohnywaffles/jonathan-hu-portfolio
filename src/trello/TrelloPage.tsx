import { memo } from 'react';
import { BoardContainer } from './BoardContainer';
import { Header } from './components/Header';
import { SwitchBoardButton } from './components/Board/SwitchBoardButton';

const TrelloPage: React.FC = memo(function TrelloPage() {
  return (
    <div className="h-dvh w-full overflow-hidden bg-white">
      <Header />
      <BoardContainer />
      <SwitchBoardButton />
    </div>
  );
});

export default TrelloPage;
