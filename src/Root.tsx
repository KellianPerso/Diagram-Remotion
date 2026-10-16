import React from 'react';
import {Composition, Folder} from 'remotion';
import {Diagram} from './lib/Diagram';
import {durationOf, Entry} from './lib/entries';
import {Sequence} from './lib/Sequence';
import {ensureFonts, FPS, H, W} from './lib/theme';
import {PROJECTS} from './registry';

ensureFonts();

type Props = {still: boolean};

const render = (e: Entry): React.FC<Props> => ({still}) =>
  e.spec ? (
    <Diagram spec={e.spec} still={still} />
  ) : e.seq ? (
    <Sequence spec={e.seq} still={still} />
  ) : (
    React.createElement(e.component!, {still})
  );

export const RemotionRoot: React.FC = () => (
  <>
    {PROJECTS.map((p) => (
      <Folder key={p.name} name={p.name}>
        {p.entries.map((e) => (
          <Composition
            key={e.id}
            id={e.id}
            component={render(e)}
            durationInFrames={durationOf(e)}
            fps={FPS}
            width={W}
            height={H}
            defaultProps={{still: false}}
          />
        ))}
      </Folder>
    ))}
  </>
);
