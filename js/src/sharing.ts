export type Sharing = {
  version: '0.1.0';
  name: 'sharing';
  instructions: [
    {
      name: 'initSharingAccount';
      accounts: [
        {
          name: 'sharingAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'tokenAccount';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'depositAccount';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'user';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'sharingBump';
          type: 'u8';
        },
        {
          name: 'assetId';
          type: 'publicKey';
        },
        {
          name: 'splitPercentAmount';
          type: 'u64';
        },
        {
          name: 'splitPercentDecimals';
          type: 'u8';
        }
      ];
    },
    {
      name: 'updateSharingAccountSplitPercent';
      accounts: [
        {
          name: 'sharingAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'user';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'splitPercentAmount';
          type: 'u64';
        },
        {
          name: 'splitPercentDecimals';
          type: 'u8';
        }
      ];
    },
    {
      name: 'shareBalance';
      accounts: [
        {
          name: 'sharingAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'tokenAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'depositAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'affiliateAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'user';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: 'recover';
      accounts: [
        {
          name: 'sharingAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'tokenAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'depositAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'user';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: 'sharingAccount';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'tokenAccount';
            type: 'publicKey';
          },
          {
            name: 'depositAccount';
            type: 'publicKey';
          },
          {
            name: 'splitPercentAmount';
            type: 'u64';
          },
          {
            name: 'splitPercentDecimals';
            type: 'u8';
          }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: 'OnlyWrappedSolIsSupported';
      msg: 'Only Wrapped Sol Is Supported: Deposit Account and Token Account must be Wrapped SOL';
    }
  ];
};

export const IDL: Sharing = {
  version: '0.1.0',
  name: 'sharing',
  instructions: [
    {
      name: 'initSharingAccount',
      accounts: [
        {
          name: 'sharingAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenAccount',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'depositAccount',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'user',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'sharingBump',
          type: 'u8',
        },
        {
          name: 'assetId',
          type: 'publicKey',
        },
        {
          name: 'splitPercentAmount',
          type: 'u64',
        },
        {
          name: 'splitPercentDecimals',
          type: 'u8',
        },
      ],
    },
    {
      name: 'updateSharingAccountSplitPercent',
      accounts: [
        {
          name: 'sharingAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'user',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'splitPercentAmount',
          type: 'u64',
        },
        {
          name: 'splitPercentDecimals',
          type: 'u8',
        },
      ],
    },
    {
      name: 'shareBalance',
      accounts: [
        {
          name: 'sharingAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'depositAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'affiliateAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'user',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'recover',
      accounts: [
        {
          name: 'sharingAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'depositAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'user',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: 'sharingAccount',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'tokenAccount',
            type: 'publicKey',
          },
          {
            name: 'depositAccount',
            type: 'publicKey',
          },
          {
            name: 'splitPercentAmount',
            type: 'u64',
          },
          {
            name: 'splitPercentDecimals',
            type: 'u8',
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: 'OnlyWrappedSolIsSupported',
      msg: 'Only Wrapped Sol Is Supported: Deposit Account and Token Account must be Wrapped SOL',
    },
  ],
};
