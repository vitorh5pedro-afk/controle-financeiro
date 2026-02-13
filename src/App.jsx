import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'controle-financeiro-dados'

const categorias = [
  'Moradia',
  'Alimentação',
  'Transporte',
  'Saúde',
  'Educação',
  'Lazer',
  'Assinaturas',
  'Outros',
]

const dadosIniciais = {
  contas: [],
  sessaoAtiva: null,
}

const formatarMoeda = (valor) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor)

const gerarUsuario = () => {
  const sufixo = Math.random().toString(36).slice(2, 8)
  return `user_${sufixo}`
}

const gerarSenha = () => {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
  return Array.from({ length: 10 }, () => caracteres[Math.floor(Math.random() * caracteres.length)]).join('')
}

function App() {
  const [dados, setDados] = useState(() => {
    const local = localStorage.getItem(STORAGE_KEY)
    return local ? JSON.parse(local) : dadosIniciais
  })

  const [credenciaisGeradas, setCredenciaisGeradas] = useState(null)
  const [login, setLogin] = useState({ usuario: '', senha: '' })
  const [erroLogin, setErroLogin] = useState('')
  const [transacao, setTransacao] = useState({
    descricao: '',
    valor: '',
    tipo: 'despesa',
    natureza: 'variavel',
    recorrente: false,
    categoria: categorias[0],
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados))
  }, [dados])

  const contaAtiva = useMemo(
    () => dados.contas.find((conta) => conta.usuario === dados.sessaoAtiva) || null,
    [dados],
  )

  const metricas = useMemo(() => {
    if (!contaAtiva) {
      return null
    }

    const receitas = contaAtiva.transacoes
      .filter((item) => item.tipo === 'receita')
      .reduce((acc, item) => acc + item.valor, 0)

    const despesasFixas = contaAtiva.transacoes
      .filter((item) => item.tipo === 'despesa' && item.natureza === 'fixa')
      .reduce((acc, item) => acc + item.valor, 0)

    const despesasVariaveis = contaAtiva.transacoes
      .filter((item) => item.tipo === 'despesa' && item.natureza === 'variavel')
      .reduce((acc, item) => acc + item.valor, 0)

    const despesasTotais = despesasFixas + despesasVariaveis
    const saldo = receitas - despesasTotais

    const recorrentes = contaAtiva.transacoes.filter((item) => item.recorrente)

    const porCategoria = contaAtiva.transacoes
      .filter((item) => item.tipo === 'despesa')
      .reduce((acc, item) => {
        acc[item.categoria] = (acc[item.categoria] || 0) + item.valor
        return acc
      }, {})

    const rankingCategorias = Object.entries(porCategoria)
      .sort((a, b) => b[1] - a[1])
      .map(([categoria, valor]) => ({ categoria, valor }))

    return {
      receitas,
      despesasFixas,
      despesasVariaveis,
      saldo,
      recorrentes,
      rankingCategorias,
    }
  }, [contaAtiva])

  const criarConta = () => {
    const usuario = gerarUsuario()
    const senha = gerarSenha()

    const novaConta = {
      usuario,
      senha,
      transacoes: [
        {
          id: crypto.randomUUID(),
          descricao: 'Salário mensal',
          valor: 5000,
          tipo: 'receita',
          natureza: 'fixa',
          recorrente: true,
          categoria: 'Outros',
        },
        {
          id: crypto.randomUUID(),
          descricao: 'Aluguel',
          valor: 1600,
          tipo: 'despesa',
          natureza: 'fixa',
          recorrente: true,
          categoria: 'Moradia',
        },
        {
          id: crypto.randomUUID(),
          descricao: 'Mercado',
          valor: 900,
          tipo: 'despesa',
          natureza: 'variavel',
          recorrente: false,
          categoria: 'Alimentação',
        },
      ],
    }

    setDados((atual) => ({
      ...atual,
      contas: [...atual.contas, novaConta],
    }))

    setCredenciaisGeradas({ usuario, senha })
    setLogin({ usuario, senha: '' })
    setErroLogin('')
  }

  const entrar = (evento) => {
    evento.preventDefault()

    const conta = dados.contas.find(
      (item) => item.usuario === login.usuario.trim() && item.senha === login.senha,
    )

    if (!conta) {
      setErroLogin('Usuário ou senha inválidos. Verifique e tente novamente.')
      return
    }

    setDados((atual) => ({
      ...atual,
      sessaoAtiva: conta.usuario,
    }))

    setErroLogin('')
  }

  const sair = () => {
    setDados((atual) => ({ ...atual, sessaoAtiva: null }))
  }

  const adicionarTransacao = (evento) => {
    evento.preventDefault()
    const valorNumerico = Number(transacao.valor)

    if (!transacao.descricao || Number.isNaN(valorNumerico) || valorNumerico <= 0) {
      return
    }

    const novaTransacao = {
      id: crypto.randomUUID(),
      descricao: transacao.descricao,
      valor: valorNumerico,
      tipo: transacao.tipo,
      natureza: transacao.natureza,
      recorrente: transacao.recorrente,
      categoria: transacao.categoria,
    }

    setDados((atual) => ({
      ...atual,
      contas: atual.contas.map((conta) =>
        conta.usuario === atual.sessaoAtiva
          ? { ...conta, transacoes: [novaTransacao, ...conta.transacoes] }
          : conta,
      ),
    }))

    setTransacao({
      descricao: '',
      valor: '',
      tipo: 'despesa',
      natureza: 'variavel',
      recorrente: false,
      categoria: categorias[0],
    })
  }

  if (!contaAtiva) {
    return (
      <main className="page auth-page">
        <section className="auth-card">
          <h1>Controle Financeiro Pessoal</h1>
          <p className="subtitle">
            Acompanhe receitas, despesas fixas e variáveis em um dashboard simples, moderno e online.
          </p>

          <div className="auth-actions">
            <button type="button" onClick={criarConta} className="primary-button">
              Criar nova conta automaticamente
            </button>
            {credenciaisGeradas && (
              <div className="credentials-box">
                <strong>Credenciais geradas</strong>
                <p>Usuário: {credenciaisGeradas.usuario}</p>
                <p>Senha: {credenciaisGeradas.senha}</p>
                <small>Guarde esses dados para acessar de qualquer navegador.</small>
              </div>
            )}
          </div>

          <form className="login-form" onSubmit={entrar}>
            <h2>Entrar na plataforma</h2>
            <label>
              Usuário
              <input
                value={login.usuario}
                onChange={(event) => setLogin((atual) => ({ ...atual, usuario: event.target.value }))}
                placeholder="Digite seu usuário"
              />
            </label>
            <label>
              Senha
              <input
                type="password"
                value={login.senha}
                onChange={(event) => setLogin((atual) => ({ ...atual, senha: event.target.value }))}
                placeholder="Digite sua senha"
              />
            </label>
            <button className="primary-button" type="submit">
              Acessar dashboard
            </button>
            {erroLogin && <p className="error-text">{erroLogin}</p>}
          </form>
        </section>
      </main>
    )
  }

  const saldoClass = metricas.saldo >= 0 ? 'positive' : 'negative'

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <h1>Resumo financeiro</h1>
          <p className="subtitle">Olá, {contaAtiva.usuario}. Veja para onde seu dinheiro está indo.</p>
        </div>
        <button type="button" className="ghost-button" onClick={sair}>
          Sair
        </button>
      </header>

      <section className="cards-grid">
        <article className="info-card">
          <span>Receitas totais</span>
          <strong>{formatarMoeda(metricas.receitas)}</strong>
        </article>
        <article className="info-card">
          <span>Despesas fixas</span>
          <strong>{formatarMoeda(metricas.despesasFixas)}</strong>
        </article>
        <article className="info-card">
          <span>Despesas variáveis</span>
          <strong>{formatarMoeda(metricas.despesasVariaveis)}</strong>
        </article>
        <article className={`info-card balance ${saldoClass}`}>
          <span>Saldo atual (caixa)</span>
          <strong>{formatarMoeda(metricas.saldo)}</strong>
          <small>{metricas.saldo >= 0 ? 'Você está no positivo.' : 'Você está no negativo.'}</small>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <h2>Adicionar movimentação</h2>
          <form className="transaction-form" onSubmit={adicionarTransacao}>
            <label>
              Descrição
              <input
                value={transacao.descricao}
                onChange={(event) =>
                  setTransacao((atual) => ({ ...atual, descricao: event.target.value }))
                }
                placeholder="Ex.: Conta de luz"
              />
            </label>
            <label>
              Valor (R$)
              <input
                type="number"
                min="0"
                step="0.01"
                value={transacao.valor}
                onChange={(event) => setTransacao((atual) => ({ ...atual, valor: event.target.value }))}
                placeholder="0,00"
              />
            </label>
            <div className="inline-fields">
              <label>
                Tipo
                <select
                  value={transacao.tipo}
                  onChange={(event) => setTransacao((atual) => ({ ...atual, tipo: event.target.value }))}
                >
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                </select>
              </label>
              <label>
                Natureza
                <select
                  value={transacao.natureza}
                  onChange={(event) =>
                    setTransacao((atual) => ({ ...atual, natureza: event.target.value }))
                  }
                >
                  <option value="fixa">Fixa</option>
                  <option value="variavel">Variável</option>
                </select>
              </label>
            </div>
            <div className="inline-fields">
              <label>
                Categoria
                <select
                  value={transacao.categoria}
                  onChange={(event) =>
                    setTransacao((atual) => ({ ...atual, categoria: event.target.value }))
                  }
                >
                  {categorias.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={transacao.recorrente}
                  onChange={(event) =>
                    setTransacao((atual) => ({ ...atual, recorrente: event.target.checked }))
                  }
                />
                Gasto recorrente
              </label>
            </div>
            <button className="primary-button" type="submit">
              Salvar movimentação
            </button>
          </form>
        </article>

        <article className="panel">
          <h2>Gastos recorrentes</h2>
          <ul className="list">
            {metricas.recorrentes.length === 0 && <li>Nenhum gasto recorrente cadastrado.</li>}
            {metricas.recorrentes.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.descricao}</strong>
                  <small>
                    {item.categoria} • {item.natureza}
                  </small>
                </div>
                <span>{formatarMoeda(item.valor)}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel full-width">
          <h2>Maiores gastos por categoria</h2>
          <ul className="list categories">
            {metricas.rankingCategorias.length === 0 && <li>Cadastre despesas para visualizar categorias.</li>}
            {metricas.rankingCategorias.map((item) => (
              <li key={item.categoria}>
                <span>{item.categoria}</span>
                <strong>{formatarMoeda(item.valor)}</strong>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  )
}

export default App
