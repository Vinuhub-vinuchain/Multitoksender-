import React, { useState, useEffect } from 'react';

interface HistoryItem {
  date: string;
  token: string;
  txHash: string;
  status: string;
}

const TransactionHistory: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const historyKey = 'vinuhub_history';
  const explorer = 'https://vinuexplorer.org/tx/';

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = (filter: string = '') => {
    const stored = JSON.parse(localStorage.getItem(historyKey) || '[]') as HistoryItem[];
    setHistory(stored.filter((item) => !filter || item.token === filter));
  };

  const exportHistory = () => {
    const stored = JSON.parse(localStorage.getItem(historyKey) || '[]') as HistoryItem[];
    const csv =
      'Date,Token,Tx Hash,Status\n' +
      stored.map((h) => `"${h.date}","${h.token}","${h.txHash}","${h.status}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vinuhub-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearHistory = () => {
    localStorage.removeItem(historyKey);
    setHistory([]);
  };

  const tokens = Array.from(new Set(history.map((item) => item.token))).sort();
  tokens.unshift('');

  return (
    <div className="section">
      <strong>Transaction History</strong>
      <div className="btn-group">
        <button
          id="filterHistory"
          onClick={() =>
            document.getElementById('filterToken')!.style.display =
              document.getElementById('filterToken')!.style.display === 'none' ? 'block' : 'none'
          }
        >
          Filter by Token
        </button>
        <button id="clearHistory" onClick={clearHistory}>Clear History</button>
        <button id="exportHistory" onClick={exportHistory}>Export CSV</button>
      </div>
      <select
        id="filterToken"
        style={{ marginTop: '10px', display: 'none' }}
        onChange={(e) => loadHistory(e.target.value)}
      >
        {tokens.map((token) => (
          <option key={token} value={token}>{token || 'All Tokens'}</option>
        ))}
      </select>
      <table id="historyTable">
        <thead>
          <tr>
            <th>Date</th>
            <th>Token</th>
            <th>Tx Hash</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {history.map((item, index) => (
            <tr key={index}>
              <td>{item.date}</td>
              <td>{item.token}</td>
              <td>
                <a href={`${explorer}${item.txHash}`} target="_blank" rel="noreferrer">
                  {item.txHash.slice(0, 10)}...
                </a>
              </td>
              <td>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionHistory;
