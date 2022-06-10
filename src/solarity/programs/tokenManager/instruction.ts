import {
  Metadata,
  MetadataProgram,
} from "@metaplex-foundation/mpl-token-metadata";
import type { BN } from "@project-serum/anchor";
import { AnchorProvider, Program } from "@project-serum/anchor";
import type { Wallet } from "@saberhq/solana-contrib";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import type {
  AccountMeta,
  Connection,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";

import { TokenManagerState } from ".";
import type {
  InvalidationType,
  TOKEN_MANAGER_PROGRAM,
  TokenManagerKind,
} from "./constants";
import { TOKEN_MANAGER_ADDRESS, TOKEN_MANAGER_IDL } from "./constants";
import {
  findClaimReceiptId,
  findMintCounterId,
  findMintManagerId,
  findReceiptMintManagerId,
  findTokenManagerAddress,
} from "./pda";

export const initMintCounter = async (
  connection: Connection,
  wallet: Wallet,
  mint: PublicKey
): Promise<TransactionInstruction> => {
  const provider = new AnchorProvider(connection, wallet, {});
  const tokenManagerProgram = new Program<TOKEN_MANAGER_PROGRAM>(
    TOKEN_MANAGER_IDL,
    TOKEN_MANAGER_ADDRESS,
    provider
  );
  const [mintCounterId, _mintCounterBump] = await findMintCounterId(mint);
  return tokenManagerProgram.instruction.initMintCounter(mint, {
    accounts: {
      mintCounter: mintCounterId,
      payer: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
  });
};

export const init = async (
  connection: Connection,
  wallet: Wallet,
  mint: PublicKey,
  issuerTokenAccountId: PublicKey,
  amount: BN,
  kind: TokenManagerKind,
  invalidationType: InvalidationType,
  numInvalidators = 1
): Promise<[TransactionInstruction, PublicKey]> => {
  const provider = new AnchorProvider(connection, wallet, {});
  const tokenManagerProgram = new Program<TOKEN_MANAGER_PROGRAM>(
    TOKEN_MANAGER_IDL,
    TOKEN_MANAGER_ADDRESS,
    provider
  );

  const [[tokenManagerId], [mintCounterId]] = await Promise.all([
    findTokenManagerAddress(mint),
    findMintCounterId(mint),
  ]);

  return [
    tokenManagerProgram.instruction.init(
      {
        numInvalidators,
        amount,
        kind,
        invalidationType,
      },
      {
        accounts: {
          tokenManager: tokenManagerId,
          mintCounter: mintCounterId,
          mint: mint,
          issuer: wallet.publicKey,
          payer: wallet.publicKey,
          issuerTokenAccount: issuerTokenAccountId,
          systemProgram: SystemProgram.programId,
        },
      }
    ),
    tokenManagerId,
  ];
};

export const setTransferAuthority = (
  connection: Connection,
  wallet: Wallet,
  tokenManagerId: PublicKey,
  transferAuthorityId: PublicKey
): TransactionInstruction => {
  const provider = new AnchorProvider(connection, wallet, {});
  const tokenManagerProgram = new Program<TOKEN_MANAGER_PROGRAM>(
    TOKEN_MANAGER_IDL,
    TOKEN_MANAGER_ADDRESS,
    provider
  );

  return tokenManagerProgram.instruction.setTransferAuthority(
    transferAuthorityId,
    {
      accounts: {
        tokenManager: tokenManagerId,
        issuer: wallet.publicKey,
      },
    }
  );
};

export const issue = (
  connection: Connection,
  wallet: Wallet,
  tokenManagerId: PublicKey,
  tokenManagerTokenAccountId: PublicKey,
  issuerTokenAccountId: PublicKey
): TransactionInstruction => {
  const provider = new AnchorProvider(connection, wallet, {});
  const tokenManagerProgram = new Program<TOKEN_MANAGER_PROGRAM>(
    TOKEN_MANAGER_IDL,
    TOKEN_MANAGER_ADDRESS,
    provider
  );

  return tokenManagerProgram.instruction.issue({
    accounts: {
      tokenManager: tokenManagerId,
      tokenManagerTokenAccount: tokenManagerTokenAccountId,
      issuer: wallet.publicKey,
      issuerTokenAccount: issuerTokenAccountId,
      payer: wallet.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    },
  });
};

export const unissue = (
  connection: Connection,
  wallet: Wallet,
  tokenManagerId: PublicKey,
  tokenManagerTokenAccountId: PublicKey,
  issuerTokenAccountId: PublicKey
): TransactionInstruction => {
  const provider = new AnchorProvider(connection, wallet, {});
  const tokenManagerProgram = new Program<TOKEN_MANAGER_PROGRAM>(
    TOKEN_MANAGER_IDL,
    TOKEN_MANAGER_ADDRESS,
    provider
  );

  return tokenManagerProgram.instruction.unissue({
    accounts: {
      tokenManager: tokenManagerId,
      tokenManagerTokenAccount: tokenManagerTokenAccountId,
      issuer: wallet.publicKey,
      issuerTokenAccount: issuerTokenAccountId,
      tokenProgram: TOKEN_PROGRAM_ID,
    },
  });
};

export const creatMintManager = async (
  connection: Connection,
  wallet: Wallet,
  mintId: PublicKey
): Promise<[TransactionInstruction, PublicKey]> => {
  const provider = new AnchorProvider(connection, wallet, {});
  const tokenManagerProgram = new Program<TOKEN_MANAGER_PROGRAM>(
    TOKEN_MANAGER_IDL,
    TOKEN_MANAGER_ADDRESS,
    provider
  );

  const [mintManagerId, _mintManagerBump] = await findMintManagerId(mintId);

  return [
    tokenManagerProgram.instruction.createMintManager({
      accounts: {
        mintManager: mintManagerId,
        mint: mintId,
        freezeAuthority: wallet.publicKey,
        payer: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      },
    }),
    mintManagerId,
  ];
};

export const closeMintManager = async (
  connection: Connection,
  wallet: Wallet,
  mintId: PublicKey
): Promise<[TransactionInstruction, PublicKey]> => {
  const provider = new AnchorProvider(connection, wallet, {});
  const tokenManagerProgram = new Program<TOKEN_MANAGER_PROGRAM>(
    TOKEN_MANAGER_IDL,
    TOKEN_MANAGER_ADDRESS,
    provider
  );

  const [mintManagerId] = await findMintManagerId(mintId);

  return [
    tokenManagerProgram.instruction.closeMintManager({
      accounts: {
        mintManager: mintManagerId,
        mint: mintId,
        freezeAuthority: wallet.publicKey,
        payer: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    }),
    mintManagerId,
  ];
};
