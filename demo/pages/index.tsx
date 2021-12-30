import {
  WalletDisconnectButton,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';

import type { NextPage } from 'next';
import { SharingExample } from '../components/SharingExample';

const Home: NextPage = () => {
  return (
    <div className="text-xl">
      <div>
        <WalletMultiButton />
        <WalletDisconnectButton />

        <SharingExample />
      </div>
    </div>
  );
};

export default Home;
