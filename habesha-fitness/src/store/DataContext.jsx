import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { buildSeed } from './seed';
import { addMonths, nowTime, todayISO, uid } from '../utils/format';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

const KEY = 'habesha.data.v2';
const Ctx = createContext(null);

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 1) return parsed;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return buildSeed();
}

export function DataProvider({ children }) {
  const [data, setData] = useState(load);
  const { user } = useAuth();

  // Save cache to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* storage full or blocked */
    }
  }, [data]);

  // Fetch live data from PostgreSQL via backend API
  const refresh = useCallback(async () => {
    if (user) {
      const res = await api.getAllData();
      if (res.ok && res.data) {
        setData(res.data);
      }
    } else {
      const res = await api.getPublicData();
      if (res.ok && res.data) {
        setData((d) => ({
          ...d,
          settings: res.data.settings || d.settings,
          plans: res.data.plans || d.plans,
          trainers: res.data.trainers || d.trainers,
        }));
      }
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const patch = useCallback((fn) => setData((d) => ({ ...d, ...fn(d) })), []);

  const actions = useMemo(
    () => ({
      refresh,

      // Members
      addMember: (m) => {
        const tempId = uid('mem');
        const member = {
          id: tempId,
          planId: null,
          trainerId: null,
          programId: null,
          status: 'Pending',
          expiryDate: null,
          notes: '',
          joinDate: todayISO(),
          ...m,
        };

        // Optimistic UI update
        patch((d) => ({ members: [member, ...d.members.filter((x) => x.id !== tempId)] }));

        // Persist to PostgreSQL
        api.addMember(m).then((res) => {
          if (res.ok && res.data?.member) {
            patch((d) => ({
              members: d.members.map((x) => (x.id === tempId ? res.data.member : x)),
            }));
          } else if (!res.ok) {
            console.error('Failed to save member to database:', res.error);
          }
        });

        return member;
      },

      updateMember: (id, changes) => {
        patch((d) => ({ members: d.members.map((m) => (m.id === id ? { ...m, ...changes } : m)) }));
        api.updateMember(id, changes).then((res) => {
          if (res.ok && res.data?.member) {
            patch((d) => ({ members: d.members.map((m) => (m.id === id ? res.data.member : m)) }));
          }
        });
      },

      deleteMember: (id) => {
        patch((d) => ({
          members: d.members.filter((m) => m.id !== id),
          attendance: d.attendance.filter((a) => a.memberId !== id),
        }));
        api.deleteMember(id).catch((err) => console.error('Failed to delete member in database:', err));
      },

      assignPlan: (memberId, planId, recordPayment = true, method = 'Cash') => {
        const plan = data.plans.find((p) => p.id === planId);
        const member = data.members.find((m) => m.id === memberId);
        if (!plan || !member) return;

        const today = todayISO();
        const start = member.status === 'Active' && member.expiryDate && member.expiryDate > today ? member.expiryDate : today;
        const tempPaymentId = uid('pay');

        patch((d) => {
          const out = {
            members: d.members.map((m) =>
              m.id === memberId ? { ...m, planId, status: 'Active', expiryDate: addMonths(start, plan.durationMonths) } : m
            ),
          };
          if (recordPayment) {
            out.payments = [
              {
                id: tempPaymentId,
                memberId,
                memberName: member.name,
                planId,
                amount: plan.price * 1,
                date: today,
                method,
                status: 'Paid',
                note: `${plan.name} plan`,
              },
              ...d.payments,
            ];
          }
          return out;
        });

        api.assignPlan(memberId, planId, recordPayment, method).then((res) => {
          if (res.ok && res.data) {
            patch((d) => ({
              members: d.members.map((m) => (m.id === memberId ? res.data.member : m)),
              ...(res.data.payment
                ? {
                    payments: [
                      res.data.payment,
                      ...d.payments.filter((p) => p.id !== tempPaymentId && p.id !== res.data.payment.id),
                    ],
                  }
                : {}),
            }));
          }
        });
      },

      // Plans
      addPlan: (p) => {
        const tempId = uid('pln');
        patch((d) => ({ plans: [...d.plans, { id: tempId, popular: false, ...p }] }));
        api.addPlan(p).then((res) => {
          if (res.ok && res.data?.plan) {
            patch((d) => ({ plans: d.plans.map((x) => (x.id === tempId ? res.data.plan : x)) }));
          }
        });
      },

      updatePlan: (id, changes) => {
        patch((d) => ({ plans: d.plans.map((p) => (p.id === id ? { ...p, ...changes } : p)) }));
        api.updatePlan(id, changes).then((res) => {
          if (res.ok && res.data?.plan) {
            patch((d) => ({ plans: d.plans.map((p) => (p.id === id ? res.data.plan : p)) }));
          }
        });
      },

      deletePlan: (id) => {
        patch((d) => ({ plans: d.plans.filter((p) => p.id !== id) }));
        api.deletePlan(id).catch((err) => console.error('Failed to delete plan in database:', err));
      },

      // Trainers
      addTrainer: (t) => {
        const tempId = uid('trn');
        patch((d) => ({ trainers: [{ id: tempId, photo: null, bio: '', ...t }, ...d.trainers] }));
        api.addTrainer(t).then((res) => {
          if (res.ok && res.data?.trainer) {
            patch((d) => ({ trainers: d.trainers.map((x) => (x.id === tempId ? res.data.trainer : x)) }));
          }
        });
      },

      updateTrainer: (id, changes) => {
        patch((d) => ({ trainers: d.trainers.map((t) => (t.id === id ? { ...t, ...changes } : t)) }));
        api.updateTrainer(id, changes).then((res) => {
          if (res.ok && res.data?.trainer) {
            patch((d) => ({ trainers: d.trainers.map((t) => (t.id === id ? res.data.trainer : t)) }));
          }
        });
      },

      deleteTrainer: (id) => {
        patch((d) => ({
          trainers: d.trainers.filter((t) => t.id !== id),
          members: d.members.map((m) => (m.trainerId === id ? { ...m, trainerId: null } : m)),
        }));
        api.deleteTrainer(id).catch((err) => console.error('Failed to delete trainer in database:', err));
      },

      // Payments
      addPayment: (p) => {
        const member = data.members.find((m) => m.id === p.memberId);
        const tempId = uid('pay');
        patch((d) => ({
          payments: [{ id: tempId, memberName: member?.name || 'Unknown', ...p }, ...d.payments],
        }));
        api.addPayment(p).then((res) => {
          if (res.ok && res.data?.payment) {
            patch((d) => ({
              payments: d.payments.map((x) => (x.id === tempId ? res.data.payment : x)),
            }));
          }
        });
      },

      updatePayment: (id, changes) => {
        patch((d) => ({ payments: d.payments.map((p) => (p.id === id ? { ...p, ...changes } : p)) }));
        api.updatePayment(id, changes).then((res) => {
          if (res.ok && res.data?.payment) {
            patch((d) => ({ payments: d.payments.map((p) => (p.id === id ? res.data.payment : p)) }));
          }
        });
      },

      deletePayment: (id) => {
        patch((d) => ({ payments: d.payments.filter((p) => p.id !== id) }));
        api.deletePayment(id).catch((err) => console.error('Failed to delete payment in database:', err));
      },

      // Attendance
      checkIn: (memberId) => {
        const tempId = uid('att');
        const rec = { id: tempId, memberId, date: todayISO(), checkIn: nowTime(), checkOut: null };
        patch((d) => ({ attendance: [rec, ...d.attendance] }));
        api.checkIn(memberId).then((res) => {
          if (res.ok && res.data?.attendance) {
            patch((d) => ({
              attendance: d.attendance.map((a) => (a.id === tempId ? res.data.attendance : a)),
            }));
          }
        });
      },

      checkOut: (id) => {
        patch((d) => ({
          attendance: d.attendance.map((a) => (a.id === id ? { ...a, checkOut: nowTime() } : a)),
        }));
        api.checkOut(id).then((res) => {
          if (res.ok && res.data?.attendance) {
            patch((d) => ({
              attendance: d.attendance.map((a) => (a.id === id ? res.data.attendance : a)),
            }));
          }
        });
      },

      deleteAttendance: (id) => {
        patch((d) => ({ attendance: d.attendance.filter((a) => a.id !== id) }));
        api.deleteAttendance(id).catch((err) => console.error('Failed to delete attendance in database:', err));
      },

      // Settings
      updateSettings: (s) => {
        patch((d) => ({ settings: { ...d.settings, ...s } }));
        api.updateSettings(s).then((res) => {
          if (res.ok && res.data?.settings) {
            patch((d) => ({ settings: res.data.settings }));
          }
        });
      },

      updateNotifications: (n) => {
        patch((d) => ({ notifications: { ...d.notifications, ...n } }));
        api.updateNotifications(n).then((res) => {
          if (res.ok && res.data?.notifications) {
            patch((d) => ({ notifications: res.data.notifications }));
          }
        });
      },

      resetDemo: async () => {
        await api.resetData();
        const res = await api.getAllData();
        if (res.ok && res.data) {
          setData(res.data);
        } else {
          setData(buildSeed());
        }
      },
    }),
    [data.plans, data.members, patch, refresh]
  );

  const value = useMemo(() => ({ ...data, ...actions }), [data, actions]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useData must be used inside <DataProvider>');
  return v;
}
