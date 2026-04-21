import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { firestore } from '../config/firebase';
import { auth } from '../config/firebase';
import {
  getAdminAnalytics,
  getOwnerAnalytics,
  createOwnerAccount,
  upsertParking,
  assignOperatorToParking,
  ownerCreateOperator,
  ownerUpdateOperatorAssignments,
  ownerSetOperatorStatus,
  ownerUpdatePaymentDetails,
} from './api';

const qk = {
  adminAnalytics: (range, uid) => ['adminAnalytics', uid || auth.currentUser?.uid || 'anon', range],
  ownerAnalytics: (range, uid) => ['ownerAnalytics', uid || auth.currentUser?.uid || 'anon', range],
  owners: (uid) => ['ownersList', uid || auth.currentUser?.uid || 'anon'],
  parkings: (uid) => ['parkingsList', uid || auth.currentUser?.uid || 'anon'],
  operators: (uid) => ['operatorsList', uid || auth.currentUser?.uid || 'anon'],
};

async function loadOwners() {
  const snap = await firestore.collection('owners').get();
  return snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => String(a.fullName || a.email || a.id).localeCompare(String(b.fullName || b.email || b.id)));
}

async function loadParkings() {
  const snap = await firestore.collection('parkings').get();
  return snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id)));
}

async function loadOperators() {
  const snap = await firestore.collection('users').where('role', '==', 'operator').get();
  return snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => String(a.fullName || a.email || a.id).localeCompare(String(b.fullName || b.email || b.id)));
}

export function useAdminAnalytics(range = '30d') {
  return useQuery({ queryKey: qk.adminAnalytics(range), queryFn: () => getAdminAnalytics(range) });
}

export function useOwnerAnalytics(range = '30d') {
  return useQuery({ queryKey: qk.ownerAnalytics(range), queryFn: () => getOwnerAnalytics(range) });
}

export function useOwnersList() {
  return useQuery({ queryKey: qk.owners(), queryFn: loadOwners });
}

export function useParkingsList() {
  return useQuery({ queryKey: qk.parkings(), queryFn: loadParkings });
}

export function useOperatorsList() {
  return useQuery({ queryKey: qk.operators(), queryFn: loadOperators });
}

function useRefreshAfterMutation(keys = []) {
  const qc = useQueryClient();
  return {
    onSuccess: () => {
      keys.forEach((key) => qc.invalidateQueries({ queryKey: key }));
    },
  };
}

export function useCreateOwnerAccount() {
  const handlers = useRefreshAfterMutation([qk.owners(), qk.adminAnalytics('7d'), qk.adminAnalytics('30d')]);
  return useMutation({ mutationFn: createOwnerAccount, ...handlers });
}

export function useUpsertParking() {
  const handlers = useRefreshAfterMutation([qk.parkings(), qk.adminAnalytics('7d'), qk.adminAnalytics('30d')]);
  return useMutation({ mutationFn: upsertParking, ...handlers });
}

export function useAssignOperatorToParking() {
  const handlers = useRefreshAfterMutation([qk.operators(), qk.parkings()]);
  return useMutation({ mutationFn: assignOperatorToParking, ...handlers });
}

export function useOwnerCreateOperator() {
  const handlers = useRefreshAfterMutation([qk.ownerAnalytics('7d'), qk.ownerAnalytics('30d')]);
  return useMutation({ mutationFn: ownerCreateOperator, ...handlers });
}

export function useOwnerUpdateOperatorAssignments() {
  const handlers = useRefreshAfterMutation([qk.ownerAnalytics('7d'), qk.ownerAnalytics('30d')]);
  return useMutation({ mutationFn: ownerUpdateOperatorAssignments, ...handlers });
}

export function useOwnerSetOperatorStatus() {
  const handlers = useRefreshAfterMutation([qk.ownerAnalytics('7d'), qk.ownerAnalytics('30d')]);
  return useMutation({ mutationFn: ownerSetOperatorStatus, ...handlers });
}

export function useOwnerUpdatePaymentDetails() {
  const handlers = useRefreshAfterMutation([qk.ownerAnalytics('7d'), qk.ownerAnalytics('30d')]);
  return useMutation({ mutationFn: ownerUpdatePaymentDetails, ...handlers });
}
