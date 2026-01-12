// dashboard.js - Dashboard do gestor
import { getEstatisticasDashboard, getTodosColaboradores } from '../firebase.js';
import { getState, setState } from './state.js';
import { showToast } from './notifications.js';
import { showLoading, hideLoading } from './utils.js';
import { loadAvisosGestor } from './avisos.js';

// Carregar dashboard do gestor
export async function loadDashboard() {
  try {
    showLoading('Carregando dashboard...');
    
    // Carregar estatísticas
    const estatisticas = await getEstatisticasDashboard();
    setState({ statistics: estatisticas });
    
    // Carregar avisos
    await loadAvisosGestor();
    
    // Atualizar UI
    updateStatisticsUI(estatisticas);
    
    hideLoading();
    
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    showToast('❌', 'Erro ao carregar dashboard', 'error');
    hideLoading();
  }
}

// Atualizar UI das estatísticas
function updateStatisticsUI(stats) {
  const elements = {
    totalColaboradores: document.getElementById('totalColaboradores'),
    avisosAtivosCount: document.getElementById('avisosAtivosCount'),
    usuariosOnline: document.getElementById('usuariosOnline'),
    statColaboradores: document.getElementById('statColaboradores'),
    statAvisos: document.getElementById('statAvisos')
  };
  
  Object.keys(elements).forEach(key => {
    if (elements[key] && stats[key] !== undefined) {
      elements[key].textContent = stats[key];
    }
  });
}

// Exportar relatórios
window.exportarRelatorios = async function() {
  try {
    const state = getState();
    
    if (!state.statistics) {
      showToast('⚠️', 'Nenhum dado disponível para exportar', 'warning');
      return;
    }
    
    showLoading('Gerando relatório...');
    
    // Dados para CSV
    let csvContent = "Relatório Portal QSSMA\n";
    csvContent += `Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
    csvContent += `Hora: ${new Date().toLocaleTimeString('pt-BR')}\n\n`;
    csvContent += "Métrica,Valor\n";
    csvContent += `Colaboradores Cadastrados,${state.statistics.totalColaboradores}\n`;
    csvContent += `Avisos Ativos,${state.statistics.totalAvisosAtivos}\n`;
    csvContent += `Usuários Online,${state.statistics.usuariosOnline}\n`;
    
    // Adicionar lista de avisos
    csvContent += "\n\nAvisos Ativos\n";
    csvContent += "Título,Destino,Prioridade,Data\n";
    
    state.avisos.forEach(aviso => {
      csvContent += `"${aviso.titulo}",${aviso.destino},${aviso.prioridade},${aviso.timestamp ? new Date(aviso.timestamp.toDate()).toLocaleDateString('pt-BR') : ''}\n`;
    });
    
    // Criar e fazer download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_qssma_${date}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('✅', 'Relatório exportado com sucesso', 'success');
    
  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    showToast('❌', 'Erro ao exportar relatório', 'error');
  } finally {
    hideLoading();
  }
};

// Atualizar estatísticas
window.atualizarRelatorios = async function() {
  try {
    showLoading('Atualizando estatísticas...');
    
    const estatisticas = await getEstatisticasDashboard();
    setState({ statistics: estatisticas });
    updateStatisticsUI(estatisticas);
    
    showToast('✅', 'Estatísticas atualizadas', 'success');
    
  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error);
    showToast('❌', 'Erro ao atualizar estatísticas', 'error');
  } finally {
    hideLoading();
  }
};
