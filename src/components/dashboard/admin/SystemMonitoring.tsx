'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Server, 
  Database, 
  Globe, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Eye,
  Settings
} from 'lucide-react';

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  change: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  source: string;
  details?: string;
}

export default function SystemMonitoring() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const loadSystemData = async () => {
      try {
        setLoading(true);
        
        // Simulation des métriques système - dans un vrai projet, on récupérerait depuis l'API
        const mockMetrics: SystemMetric[] = [
          {
            name: 'CPU Usage',
            value: 42,
            unit: '%',
            status: 'healthy',
            trend: 'stable',
            change: 2
          },
          {
            name: 'Memory Usage',
            value: 68,
            unit: '%',
            status: 'warning',
            trend: 'up',
            change: 5
          },
          {
            name: 'Disk Usage',
            value: 35,
            unit: '%',
            status: 'healthy',
            trend: 'stable',
            change: 1
          },
          {
            name: 'Database Connections',
            value: 12,
            unit: '/50',
            status: 'healthy',
            trend: 'down',
            change: -3
          },
          {
            name: 'API Response Time',
            value: 245,
            unit: 'ms',
            status: 'healthy',
            trend: 'down',
            change: -15
          },
          {
            name: 'Error Rate',
            value: 0.8,
            unit: '%',
            status: 'healthy',
            trend: 'down',
            change: -0.2
          }
        ];

        const mockLogs: LogEntry[] = [
          {
            id: '1',
            timestamp: '2024-01-15 15:30:45',
            level: 'info',
            message: 'User login successful',
            source: 'auth-service',
            details: 'User: marie.kone@example.com'
          },
          {
            id: '2',
            timestamp: '2024-01-15 15:28:12',
            level: 'warning',
            message: 'High memory usage detected',
            source: 'system-monitor',
            details: 'Memory usage: 85%'
          },
          {
            id: '3',
            timestamp: '2024-01-15 15:25:33',
            level: 'error',
            message: 'Database connection timeout',
            source: 'database-service',
            details: 'Connection pool exhausted'
          },
          {
            id: '4',
            timestamp: '2024-01-15 15:22:18',
            level: 'info',
            message: 'Course created successfully',
            source: 'course-service',
            details: 'Course ID: 12345'
          },
          {
            id: '5',
            timestamp: '2024-01-15 15:20:05',
            level: 'critical',
            message: 'API rate limit exceeded',
            source: 'api-gateway',
            details: 'Rate limit: 1000 requests/hour'
          }
        ];

        setMetrics(mockMetrics);
        setLogs(mockLogs);
      } catch (error) {
        console.error('Erreur lors du chargement des données système:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSystemData();

    // Auto-refresh si activé
    if (autoRefresh) {
      const interval = setInterval(loadSystemData, 30000); // 30 secondes
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'critical': return 'text-red-800 bg-red-200';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />;
      case 'stable': return <Activity className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-dark"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-mdsc-blue-dark to-gray-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Surveillance Système 📊</h1>
            <p className="text-gray-300">
              Surveillez les performances et la santé de votre plateforme en temps réel.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-4 w-4 text-mdsc-gold focus:ring-mdsc-gold border-gray-300 rounded"
              />
              <label htmlFor="autoRefresh" className="text-sm text-gray-300">
                Actualisation auto
              </label>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Actualiser</span>
            </button>
            <button className="bg-mdsc-gold hover:bg-yellow-600 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Exporter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Métriques système */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{metric.name}</h3>
              <div className="flex items-center space-x-2">
                {getTrendIcon(metric.trend)}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
                  {metric.status}
                </span>
              </div>
            </div>
            
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-gray-900">{metric.value}</span>
              <span className="text-sm text-gray-500">{metric.unit}</span>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Évolution</span>
                <span className={`font-medium ${metric.change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {metric.change > 0 ? '+' : ''}{metric.change}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full ${
                    metric.status === 'healthy' ? 'bg-green-500' :
                    metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(metric.value, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Services et statuts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Server className="h-5 w-5 mr-2 text-mdsc-blue-dark" />
            Services
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700">API Auth</span>
              </div>
              <span className="text-xs text-green-600 font-medium">En ligne</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700">Moodle LMS</span>
              </div>
              <span className="text-xs text-green-600 font-medium">En ligne</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700">Base de Données</span>
              </div>
              <span className="text-xs text-green-600 font-medium">En ligne</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700">OpenAI API</span>
              </div>
              <span className="text-xs text-green-600 font-medium">En ligne</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-gray-700">MinIO Storage</span>
              </div>
              <span className="text-xs text-yellow-600 font-medium">Maintenance</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Database className="h-5 w-5 mr-2 text-mdsc-blue-dark" />
            Base de Données
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Taille totale</span>
              <span className="text-sm font-medium text-gray-900">2.4 GB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Connexions actives</span>
              <span className="text-sm font-medium text-gray-900">12/50</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Requêtes/min</span>
              <span className="text-sm font-medium text-gray-900">1,247</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Temps de réponse moyen</span>
              <span className="text-sm font-medium text-gray-900">45ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Dernière sauvegarde</span>
              <span className="text-sm font-medium text-gray-900">Il y a 2h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Logs système */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-mdsc-blue-dark" />
            Logs Système
          </h3>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Settings className="h-4 w-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className={`p-1 rounded ${getLevelColor(log.level)}`}>
                {log.level === 'info' && <CheckCircle className="h-3 w-3" />}
                {log.level === 'warning' && <AlertTriangle className="h-3 w-3" />}
                {log.level === 'error' && <AlertTriangle className="h-3 w-3" />}
                {log.level === 'critical' && <AlertTriangle className="h-3 w-3" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{log.message}</span>
                  <span className="text-xs text-gray-500">{log.timestamp}</span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-500">{log.source}</span>
                  {log.details && (
                    <>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{log.details}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Database className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">Sauvegarder la base</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium">Redémarrer services</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Eye className="h-5 w-5 text-purple-500" />
            <span className="text-sm font-medium">Voir les rapports</span>
          </button>
        </div>
      </div>
    </div>
  );
}
