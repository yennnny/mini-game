import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { CalvakStyle } from '../CalvakStyle';

interface Tile {
  id: number;
  number: number;
}

const generateInitialTiles = () => {
  const nums = Array.from({ length: 25 }, (_, i) => i + 1);
  return nums.sort(() => Math.random() - 0.5).map((num, idx) => ({ id: idx, number: num }));
};

const OneToFifty: React.FC = () => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [currentNumber, setCurrentNumber] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [time, setTime] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    setTiles(generateInitialTiles());
    setCurrentNumber(1);
    setIsPlaying(false);
    setTime(0);
    setIsGameOver(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setTime(0);
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setTime(Date.now() - startTime);
    }, 10); // Update every 10ms for smooth 3-decimal display
  };

  const endGame = () => {
    setIsPlaying(false);
    setIsGameOver(true);
    if (timerRef.current) clearInterval(timerRef.current);
    // TODO: Send record to backend
    saveRecord(time / 1000);
  };

  const saveRecord = async (clearTime: number) => {
    try {
        await fetch('http://localhost:5000/api/records', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                game_id: 1, // 1 to 50
                user_id: 1, // Dummy user ID for now
                clear_time: clearTime,
                school_id: 1 // Dummy school ID
            })
        });
        console.log('Record saved');
    } catch(err) {
        console.error('Failed to save record', err);
    }
  }

  const handleTileClick = (index: number, number: number) => {
    if (!isPlaying && currentNumber === 1 && number === 1) {
      startGame();
    }

    if ((isPlaying || (!isPlaying && number === 1)) && number === currentNumber) {
      const newTiles = [...tiles];
      if (currentNumber <= 25) {
        newTiles[index] = { id: index, number: currentNumber + 25 };
      } else {
        newTiles[index] = { id: index, number: 0 }; // 0 means empty
      }
      
      setTiles(newTiles);
      setCurrentNumber((prev: number) => prev + 1);

      if (currentNumber === 50) {
        endGame();
      }
    }
  };

  const formatTime = (ms: number) => {
    return (ms / 1000).toFixed(3);
  };

  return (
    <Container>
      <Header>
        <Title>1 to 50</Title>
        <StatusBoard>
          <CurrentTarget>Target: {currentNumber <= 50 ? currentNumber : 'Clear!'}</CurrentTarget>
          <Timer>{formatTime(time)} sec</Timer>
        </StatusBoard>
      </Header>

      <GridContainer>
        {tiles.map((tile: Tile, index: number) => (
          <TileButton
            key={tile.id}
            onClick={() => handleTileClick(index, tile.number)}
            isEmpty={tile.number === 0}
            isNext={tile.number === currentNumber}
          >
            {tile.number !== 0 ? tile.number : ''}
          </TileButton>
        ))}
      </GridContainer>

      {isGameOver && (
        <GameOverModal>
          <ResultText>Clear Time: {formatTime(time)} sec!</ResultText>
          <RestartButton onClick={initGame}>다시하기</RestartButton>
          <ShareButton>공유하기 (소모임)</ShareButton>
        </GameOverModal>
      )}
    </Container>
  );
};

export default OneToFifty;

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  background-color: ${CalvakStyle.colors.background};
  font-family: ${CalvakStyle.typography.fontFamily};
`;

const Header = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  color: ${CalvakStyle.colors.primary};
  margin: 0 0 10px 0;
`;

const StatusBoard = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 10px 20px;
  background-color: ${CalvakStyle.colors.boardBackground};
  border-radius: ${CalvakStyle.borderRadius};
  box-sizing: border-box;
`;

const CurrentTarget = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
`;

const Timer = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: ${CalvakStyle.colors.primary};
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  width: 100%;
  aspect-ratio: 1 / 1;
  background-color: ${CalvakStyle.colors.gridColor};
  padding: 8px;
  border-radius: ${CalvakStyle.borderRadius};
  box-sizing: border-box;
`;

const TileButton = styled.button<{ isEmpty: boolean; isNext: boolean }>`
  background-color: ${(props: any) => (props.isEmpty ? 'transparent' : CalvakStyle.colors.background)};
  border: none;
  border-radius: 8px;
  font-size: 1.5rem;
  font-weight: bold;
  color: ${CalvakStyle.colors.text};
  cursor: ${(props: any) => (props.isEmpty ? 'default' : 'pointer')};
  box-shadow: ${(props: any) => (props.isEmpty ? 'none' : '0 2px 4px rgba(0,0,0,0.1)')};
  transition: all 0.1s;

  &:active {
    transform: ${(props: any) => (props.isEmpty ? 'none' : 'scale(0.95)')};
  }
`;

const GameOverModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 30px;
  border-radius: ${CalvakStyle.borderRadius};
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
`;

const ResultText = styled.h2`
  color: ${CalvakStyle.colors.primary};
  margin: 0;
`;

const RestartButton = styled.button`
  background-color: ${CalvakStyle.colors.primary};
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 20px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  width: 100%;

  &:hover {
    background-color: ${CalvakStyle.colors.buttonHover};
  }
`;

const ShareButton = styled(RestartButton)`
  background-color: ${CalvakStyle.colors.secondary};
`;
