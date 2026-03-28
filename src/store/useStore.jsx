import { create } from 'zustand';
import { clientes, agendamentos, servicos, historico } from '../data/mockData';

const useStore = create((set, get) => ({
  clientes: clientes,
  agendamentos: agendamentos,
  servicos: servicos,
  historico: historico,

  addCliente: (cliente) =>
    set((state) => ({
      clientes: [
        ...state.clientes,
        { ...cliente, id: String(state.clientes.length + 1) },
      ],
    })),

  addAgendamento: (agendamento) =>
    set((state) => ({
      agendamentos: [
        ...state.agendamentos,
        { ...agendamento, id: String(state.agendamentos.length + 1), status: 'livre' },
      ],
    })),

  getClienteById: (id) => get().clientes.find((c) => c.id === id),

  getAgendamentosPorData: (data) =>
    get().agendamentos.filter((a) => a.data === data),

  getHistoricoCliente: (clienteId) =>
    get().historico.filter((h) => h.clienteId === clienteId),

  getFaturamentoDia: (data) =>
    get()
      .agendamentos.filter((a) => a.data === data && a.status === 'finalizado')
      .reduce((sum, a) => sum + a.valor, 0),

  getClientesDia: (data) =>
    get().agendamentos.filter((a) => a.data === data).length,
}));

export default useStore;
