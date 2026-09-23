import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

/*
 * AUDITORIA DE SOFTWARE - SIMUL
 * Este arquivo foi analisado conforme o checklist da atividade:
 * estrutura, qualidade, padronização, versionamento, documentação,
 * build/execução e manutenibilidade.
 *
 * Os comentários marcados como "AUDITORIA" registram pontos encontrados
 * durante a análise e sugestões de melhoria. Eles não substituem a
 * implementação das correções; servem como evidência/documentação da auditoria.
 */

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
const TOKEN_KEY = 'simul_token'

const demoAreas = [
  { cidade: 'Goiânia', bairro: 'Setor Bueno', rotaId: 1, rota: 'Rota Centro-Sul' },
  { cidade: 'Goiânia', bairro: 'Setor Oeste', rotaId: 1, rota: 'Rota Centro-Sul' },
  { cidade: 'Goiânia', bairro: 'Jardim América', rotaId: 2, rota: 'Rota Oeste' },
  { cidade: 'Aparecida de Goiânia', bairro: 'Centro', rotaId: 3, rota: 'Rota Aparecida' },
]

const demoCronogramas = [
  { diaSemana: 'TERCA', inicio: '07:00', fim: '11:00' },
  { diaSemana: 'QUINTA', inicio: '07:00', fim: '11:00' },
]

/*
 * AUDITORIA - MELHORIA DE MANUTENIBILIDADE:
 * A função de requisição foi centralizada, evitando repetir a montagem
 * de headers, token, leitura da resposta e tratamento básico de erros.
 *
 * MELHORIA FUTURA RECOMENDADA:
 * Mover esta função para src/services/api.js para separar comunicação
 * com a API da camada de interface.
 */
async function request(path, options = {}) {
  if (!API_URL) throw new Error('API não configurada')
  const headers = { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) }
  const token = sessionStorage.getItem(TOKEN_KEY)
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const type = response.headers.get('content-type') || ''
  const data = type.includes('json') ? await response.json() : await response.text()
  if (!response.ok) throw new Error(data?.detail || data?.mensagem || data?.message || `Erro ${response.status}`)
  return data
}

/*
 * AUDITORIA - ESTRUTURA:
 * Este hook já possui uma responsabilidade relativamente específica.
 *
 * PONTO DE MELHORIA:
 * O fallback para demoAreas permite que a interface continue funcionando
 * quando a API falha, mas pode esconder um problema real de comunicação.
 * Em produção, recomenda-se diferenciar "API indisponível" de "dados de demonstração".
 *
 * MELHORIA DE ARQUITETURA:
 * Este hook pode ser movido para src/hooks/useAreas.js.
 */
function useAreas() {
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    request('/api/rotas/areas').then(data => {
      if (active) setAreas(Array.isArray(data) ? data : [])
    }).catch(() => {
      if (active) setAreas(demoAreas)
    }).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])
  return { areas: areas.length ? areas : demoAreas, loading }
}

function App() {
  return (
    <div className="site">
      <Header />
      <Routes>
        <Route path="/" element={<Consulta />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/conta" element={<Conta />} />
        <Route path="/preferencias" element={<Preferencias />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Consulta />} />
      </Routes>
      <Footer />
    </div>
  )
}

function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = Boolean(sessionStorage.getItem(TOKEN_KEY))
  const [open, setOpen] = useState(false)
  const logout = () => { sessionStorage.removeItem(TOKEN_KEY); setOpen(false); navigate('/') }
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <Link className="brand" to="/" onClick={() => setOpen(false)}>
          <span className="brand__mark">♻</span>
          <span><b>SIMUL</b><small>Limpeza urbana</small></span>
        </Link>
        <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Abrir menu">☰</button>
        <nav className={open ? 'nav nav--open' : 'nav'}>
          <NavLink end to="/" onClick={() => setOpen(false)}>Consultar coleta</NavLink>
          <a href="#como-funciona" onClick={() => setOpen(false)}>Como funciona</a>
          <a href="#descarte" onClick={() => setOpen(false)}>Descarte consciente</a>
          {token ? <>
            <NavLink to="/preferencias" onClick={() => setOpen(false)}>🔔 Lembretes</NavLink>
            <NavLink to="/conta" onClick={() => setOpen(false)}>Minha conta</NavLink>
            <button className="nav__exit" onClick={logout}>Sair</button>
          </> : <>
            <NavLink to="/login" onClick={() => setOpen(false)}>Entrar</NavLink>
            <NavLink className="nav__join" to="/cadastro" onClick={() => setOpen(false)}>Criar conta</NavLink>
          </>}
        </nav>
      </div>
      {location.pathname !== '/' && <div className="breadcrumb"><div>SIMUL <span>›</span> {location.pathname.replace('/', '').replace('-', ' ') || 'início'}</div></div>}
    </header>
  )
}

function Page({ eyebrow, title, text, children }) {
  return <main className="page"><section className="page__head"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{text && <p>{text}</p>}</div></section>{children}</main>
}

function Consulta() {
  const { areas, loading } = useAreas()
  const [cidade, setCidade] = useState('')
  const [bairro, setBairro] = useState('')
  const [resultado, setResultado] = useState(null)
  const [busy, setBusy] = useState(false)
  const [erro, setErro] = useState('')
  const cidades = useMemo(() => [...new Set(areas.map(a => a.cidade).filter(Boolean))].sort(), [areas])
  const bairros = useMemo(() => [...new Set(areas.filter(a => a.cidade === cidade).map(a => a.bairro).filter(Boolean))].sort(), [areas, cidade])

  /*
   * AUDITORIA - QUALIDADE / MANUTENIBILIDADE:
   * Este componente concentra seleção de região, chamada à API,
   * tratamento de erro e apresentação do resultado.
   *
   * Classificação: 🟠 MÉDIO.
   * Recomenda-se separar a consulta à API e componentes visuais em módulos
   * próprios para reduzir a quantidade de responsabilidades deste arquivo.
   */
  async function consultar(e) {
    e.preventDefault(); setErro(''); setResultado(null)
    if (!cidade || !bairro) { setErro('Escolha a cidade e o bairro para continuar.'); return }
    setBusy(true)
    try {
      const data = await request(`/api/rotas/consulta?${new URLSearchParams({ cidade, bairro })}`)
      setResultado(data)
    } catch {
      /*
       * AUDITORIA - PONTO DE ATENÇÃO:
       * Em caso de falha da API, dados de demonstração são exibidos.
       * Isso melhora a experiência de demonstração, mas pode mascarar
       * uma falha do backend em ambiente real.
       *
       * MELHORIA PROPOSTA:
       * Em produção, informar claramente que a API está indisponível
       * antes de utilizar dados de demonstração.
       */
      const area = areas.find(a => a.cidade === cidade && a.bairro === bairro)
      setResultado({ cidade, bairro, rotaId: area?.rotaId || 1, nomeRota: area?.rota || 'Rota de coleta seletiva', cronogramas: demoCronogramas })
    } finally { setBusy(false) }
  }
  return <main>
    <section className="hero">
      <div className="hero__content">
        <div className="hero__copy"><span className="eyebrow eyebrow--light">SIMUL · COLETA SELETIVA</span><h1>Descubra quando a coleta passa na sua rua.</h1><p>Informe sua região e encontre o dia e o horário previstos para a coleta. Sem complicação.</p><div className="hero__notes"><span>✓ Consulta pública</span><span>✓ Informação atualizada</span><span>✓ Feito para sua cidade</span></div></div>
        <div className="search-card"><div className="search-card__top"><span className="search-icon">⌕</span><div><strong>Consultar minha coleta</strong><small>Escolha sua região abaixo</small></div></div>
          <form onSubmit={consultar} className="search-form">
            <label>Cidade<select value={cidade} onChange={e => { setCidade(e.target.value); setBairro(''); setResultado(null) }} disabled={loading}><option value="">Selecione a cidade</option>{cidades.map(c => <option key={c}>{c}</option>)}</select></label>
            <label>Bairro<select value={bairro} onChange={e => setBairro(e.target.value)} disabled={!cidade || loading}><option value="">Selecione o bairro</option>{bairros.map(b => <option key={b}>{b}</option>)}</select></label>
            <button className="button button--primary" disabled={busy}>{busy ? 'Consultando...' : 'Ver coleta →'}</button>
          </form>
          {erro && <div className="alert alert--error">{erro}</div>}
        </div>
      </div>
    </section>
    {resultado && <section className="result-wrap"><div className="result-card"><div className="result-card__heading"><div><span className="eyebrow">SUA REGIÃO</span><h2>{resultado.bairro}</h2><p>{resultado.cidade} · {resultado.nomeRota || resultado.rota}</p></div><span className="status">● Rota ativa</span></div><div className="schedule-grid">{(resultado.cronogramas || demoCronogramas).map((item, i) => <div className="schedule" key={i}><span>{day(item.diaSemana)}</span><strong>{item.inicio} – {item.fim}</strong><small>Coloque os materiais antes do início da janela.</small></div>)}</div><div className="map-box"><div className="map-box__pattern"></div><div><span className="map-pin">⌖</span><strong>Mapa da região</strong><p>Visualização preparada para OpenStreetMap e localização da área atendida.</p></div></div><div className="result-tip">💡 <b>Dica:</b> deixe os recicláveis separados, secos e bem fechados antes do horário indicado.</div></div></section>}
    <section id="como-funciona" className="section"><div className="section__title"><span className="eyebrow">SIMPLES ASSIM</span><h2>Como usar o SIMUL</h2><p>Você não precisa criar uma conta para descobrir a coleta da sua região.</p></div><div className="steps"><Step n="01" title="Escolha sua região" text="Informe a cidade e o bairro onde você mora."/><Step n="02" title="Veja a programação" text="Confira a rota e a janela de horário disponível."/><Step n="03" title="Ative um lembrete" text="Se quiser, crie uma conta e receba avisos por e-mail."/></div></section>
    <section id="descarte" className="section section--soft"><div className="section__title"><span className="eyebrow">DESCARTE CONSCIENTE</span><h2>Separar bem faz diferença.</h2></div><div className="materials"><Material icon="📦" title="Papel e papelão" text="Mantenha secos e sem restos de comida."/><Material icon="🥫" title="Metal" text="Latas limpas e, quando possível, amassadas."/><Material icon="🍾" title="Vidro" text="Embale peças quebradas com segurança."/><Material icon="♻" title="Plástico" text="Esvazie, enxágue quando necessário e separe."/></div></section>
    <section className="cta"><div><span className="eyebrow eyebrow--light">QUER RECEBER AVISOS?</span><h2>Não precisa lembrar sozinho.</h2><p>Crie sua conta e escolha a antecedência do lembrete da coleta.</p></div><Link className="button button--white" to="/cadastro">Criar minha conta →</Link></section>
  </main>
}

function day(value) { return ({SEGUNDA:'Segunda-feira',TERCA:'Terça-feira',QUARTA:'Quarta-feira',QUINTA:'Quinta-feira',SEXTA:'Sexta-feira',SABADO:'Sábado',DOMINGO:'Domingo'}[value] || value || 'Dia da coleta') }
function Step({ n, title, text }) { return <div className="step"><span>{n}</span><div><h3>{title}</h3><p>{text}</p></div></div> }
function Material({ icon, title, text }) { return <article className="material"><span>{icon}</span><h3>{title}</h3><p>{text}</p></article> }

function AuthCard({ type }) {
  const navigate = useNavigate(); const login = type === 'login'
  const [nome, setNome] = useState(''); const [email, setEmail] = useState(''); const [senha, setSenha] = useState(''); const [confirm, setConfirm] = useState(''); const [erro, setErro] = useState(''); const [busy, setBusy] = useState(false)

  /*
   * AUDITORIA - QUALIDADE:
   * AuthCard concentra login e cadastro no mesmo componente.
   * Isso reduz duplicação de interface, mas também aumenta a quantidade
   * de responsabilidades do componente.
   *
   * MELHORIA FUTURA:
   * Separar validação, comunicação com a API e componentes de formulário
   * em módulos próprios caso a autenticação cresça.
   */
  async function submit(e) {
    e.preventDefault(); setErro('')
    if (!email || !senha || (!login && (!nome || senha !== confirm))) { setErro(login ? 'Preencha e-mail e senha.' : 'Preencha os campos e confira as senhas.'); return }
    setBusy(true)
    try {
      if (login) { const data = await request('/api/auth/login', { method:'POST', body: JSON.stringify({ email, senha }) }); sessionStorage.setItem(TOKEN_KEY, data.token) }
      else await request('/api/usuarios', { method:'POST', body: JSON.stringify({ nome, email, senha }) })
      navigate(login ? '/conta' : '/login')
    } catch (error) {
      if (login) setErro(error.message || 'Não foi possível entrar. Verifique seus dados.')
      else setErro(error.message || 'Não foi possível criar a conta.')
    } finally { setBusy(false) }
  }
  return <Page eyebrow={login ? 'ACESSO' : 'NOVO USUÁRIO'} title={login ? 'Bem-vindo de volta.' : 'Crie sua conta.'} text={login ? 'Entre para acompanhar suas preferências e lembretes.' : 'Tenha seus lembretes da coleta organizados em um só lugar.'}><div className="auth-layout"><div className="auth-card"><form onSubmit={submit} className="form-stack">
    {!login && <label>Nome completo<input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Como podemos chamar você?" autoComplete="name"/></label>}
    <label>E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com" autoComplete="email"/></label>
    <label>Senha<input type="password" value={senha} onChange={e=>setSenha(e.target.value)} placeholder="Digite sua senha" autoComplete={login?'current-password':'new-password'}/></label>
    {!login && <label>Confirme a senha<input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repita a senha" autoComplete="new-password"/></label>}
    {erro && <div className="alert alert--error">{erro}</div>}
    <button className="button button--primary button--full" disabled={busy}>{busy ? 'Aguarde...' : login ? 'Entrar no SIMUL' : 'Criar conta'}</button>
  </form><p className="form-help">{login ? <>Ainda não tem conta? <Link to="/cadastro">Criar conta</Link></> : <>Já possui conta? <Link to="/login">Entrar</Link></>}</p></div><aside className="auth-aside"><span className="auth-aside__icon">♻</span><h2>Uma rotina mais fácil.</h2><p>O SIMUL transforma a programação da coleta em uma informação simples de consultar e acompanhar.</p></aside></div></Page>
}
function Login() { return <AuthCard type="login"/> }
function Cadastro() { return <AuthCard type="register"/> }

function Conta() {
  const [user, setUser] = useState(null); const [erro,setErro]=useState('')

  /*
   * AUDITORIA - ERRO ENCONTRADO (🟠 MÉDIO):
   * O catch abaixo trata a falha colocando um usuário de demonstração
   * em setUser. Como o erro é consumido pelo primeiro catch, o segundo
   * catch não funciona como tratamento independente do erro original.
   *
   * PROPOSTA DA ATIVIDADE:
   * Reestruturar este fluxo com try/catch (ou um único catch) para que
   * a mensagem de erro seja registrada corretamente em setErro.
   *
   * OBSERVAÇÃO:
   * Este comentário documenta o problema encontrado; a correção do
   * comportamento deve ser feita em uma alteração específica de código.
   */
  useEffect(()=>{ request('/api/usuarios/me').then(setUser).catch(()=>setUser({nome:'Usuário SIMUL',email:'conta configurada',perfil:'USUARIO'})).catch(e=>setErro(e.message)) },[])

  /*
   * AUDITORIA - ERRO DE INTERFACE (🟠 MÉDIO):
   * O título abaixo utiliza "Olá, {nome}" como texto literal.
   * Não existe uma variável nome definida neste componente e, em JSX,
   * as chaves não são interpretadas quando estão dentro de uma string.
   *
   * CORREÇÃO PROPOSTA:
   * Usar uma expressão JSX baseada em user?.nome, por exemplo:
   * title={`Olá, ${user?.nome || 'usuário'}`}
   */
  return <Page eyebrow="MINHA CONTA" title="Olá, {nome}" text="Aqui você encontra seus atalhos e configurações."><div className="profile-card"><div className="avatar">{user?.nome?.[0] || 'U'}</div><div><span className="eyebrow">PERFIL</span><h2>{user?.nome || 'Carregando...'}</h2><p>{user?.email || ''}</p><span className="tag">{user?.perfil === 'ADMIN' ? 'Administrador' : 'Morador'}</span></div></div>{erro && <div className="alert alert--error">{erro}</div>}<div className="shortcut-grid"><Link to="/" className="shortcut"><span>♻</span><b>Consultar coleta</b><small>Ver dias e horários da sua região.</small></Link><Link to="/preferencias" className="shortcut"><span>🔔</span><b>Meus lembretes</b><small>Escolher rota e antecedência.</small></Link><Link to="/admin" className="shortcut"><span>⚙</span><b>Painel administrativo</b><small>Área reservada para administradores.</small></Link></div></Page>
}

function Preferencias() {
  const { areas } = useAreas(); const [cidade,setCidade]=useState(''); const [bairro,setBairro]=useState(''); const [email,setEmail]=useState(true); const [horas,setHoras]=useState(3); const [msg,setMsg]=useState(''); const [erro,setErro]=useState(''); const bairros=[...new Set(areas.filter(a=>a.cidade===cidade).map(a=>a.bairro))].sort()

  /*
   * AUDITORIA - QUALIDADE / CONFIABILIDADE (🟠 MÉDIO):
   * Quando a API de preferências falha, o código mostra uma mensagem
   * informando que as preferências foram atualizadas no painel.
   * Isso pode ser interpretado como sucesso mesmo quando a gravação
   * no servidor não aconteceu.
   *
   * MELHORIA PROPOSTA:
   * Separar claramente "salvo no servidor" de "alteração local/demonstração"
   * e informar o usuário quando a API estiver indisponível.
   */
  async function save(e){e.preventDefault();setErro('');setMsg('');if(!cidade||!bairro){setErro('Escolha sua cidade e seu bairro.');return}try{await request('/api/notificacoes/preferencias',{method:'PUT',body:JSON.stringify({rotaId:areas.find(a=>a.cidade===cidade&&a.bairro===bairro)?.rotaId,emailAtivo:email,antecedenciaHoras:Number(horas)})});setMsg('Preferências salvas com sucesso.')}catch{setMsg('Preferências atualizadas neste painel. Ao conectar a API, elas serão persistidas no servidor.')}}
  return <Page eyebrow="LEMBRETES" title="Deixe o SIMUL lembrar por você." text="Escolha sua região e diga com quanto tempo de antecedência você quer receber o aviso."><form className="settings-card form-stack" onSubmit={save}><div className="settings-section"><span className="step-number">1</span><div><h2>Minha região</h2><p>Ela será usada para relacionar o lembrete à rota correta.</p></div></div><div className="form-grid"><label>Cidade<select value={cidade} onChange={e=>{setCidade(e.target.value);setBairro('')}}><option value="">Selecione</option>{[...new Set(areas.map(a=>a.cidade))].map(x=><option key={x}>{x}</option>)}</select></label><label>Bairro<select value={bairro} onChange={e=>setBairro(e.target.value)} disabled={!cidade}><option value="">Selecione</option>{bairros.map(x=><option key={x}>{x}</option>)}</select></label></div><div className="settings-section"><span className="step-number">2</span><div><h2>Quando avisar?</h2><p>O sistema poderá enviar o lembrete por e-mail sem você precisar estar com o site aberto.</p></div></div><label>Antecedência<select value={horas} onChange={e=>setHoras(e.target.value)}><option value="0">No momento da coleta</option><option value="1">1 hora antes</option><option value="3">3 horas antes</option><option value="6">6 horas antes</option><option value="12">12 horas antes</option><option value="24">1 dia antes</option></select></label><label className="switch-row"><input type="checkbox" checked={email} onChange={e=>setEmail(e.target.checked)}/><span><b>Receber lembrete por e-mail</b><small>Você pode alterar essa opção quando quiser.</small></span></label>{erro&&<div className="alert alert--error">{erro}</div>}{msg&&<div className="alert alert--success">{msg}</div>}<button className="button button--primary" type="submit">Salvar preferências</button></form></Page>
}

function Admin() {
  const [tab,setTab]=useState('resumo'); const {areas}=useAreas(); const [rotas,setRotas]=useState([]); const [cron,setCron]=useState([])
  useEffect(()=>{Promise.all([request('/api/admin/rotas').catch(()=>[]),request('/api/admin/cronogramas').catch(()=>[])]).then(([r,c])=>{setRotas(r);setCron(c)})},[])
  const cards=[['Rotas',rotas.length || 3,'Rotas oficiais cadastradas'],['Áreas',areas.length, 'Regiões disponíveis'],['Cronogramas',cron.length || 2,'Horários configurados']]
  return <Page eyebrow="ADMINISTRAÇÃO" title="Painel do SIMUL" text="Um espaço direto para manter as informações que chegam ao morador sempre organizadas."><div className="admin-tabs">{[['resumo','Visão geral'],['rotas','Rotas'],['areas','Áreas atendidas'],['cron','Cronogramas']].map(([id,label])=><button className={tab===id?'active':''} key={id} onClick={()=>setTab(id)}>{label}</button>)}</div>{tab==='resumo'&&<><div className="metric-grid">{cards.map(([a,b,c])=><div className="metric" key={a}><span>{a}</span><strong>{b}</strong><small>{c}</small></div>)}</div><div className="admin-note"><b>Boa prática</b><p>As informações administrativas alimentam a consulta pública e os lembretes. Antes de alterar uma rota, confira a cidade, o bairro e os horários associados.</p></div></>}{tab==='rotas'&&<AdminTable title="Rotas cadastradas" rows={rotas} empty="A API ainda não retornou rotas. A estrutura está pronta para o CRUD."/>}{tab==='areas'&&<AdminTable title="Áreas atendidas" rows={areas} empty="Nenhuma área cadastrada."/>}{tab==='cron'&&<AdminTable title="Cronogramas" rows={cron} empty="Nenhum cronograma cadastrado."/>}</Page>
}
function AdminTable({title,rows,empty}){
  /*
   * AUDITORIA - FUNCIONALIDADE INCOMPLETA (🟠 MÉDIO):
   * O botão "+ Novo" aparece na interface, mas não possui onClick nem
   * formulário associado. A interface sugere um CRUD que ainda não está
   * implementado neste componente.
   *
   * CORREÇÃO PROPOSTA:
   * Implementar o fluxo de criação (formulário/modal + POST na API)
   * ou ocultar o botão enquanto a funcionalidade não estiver disponível.
   */
  return <div className="table-card"><div className="table-card__head"><h2>{title}</h2><button className="button button--secondary">+ Novo</button></div>{rows.length?<div className="table-wrap"><table><thead><tr><th>Identificação</th><th>Detalhes</th><th>Status</th></tr></thead><tbody>{rows.map((r,i)=><tr key={r.id||i}><td>{r.nomeRota||r.nome||r.bairro||`Registro ${i+1}`}</td><td>{r.cidade||r.diaSemana||'Informação operacional'}</td><td><span className="status status--small">● {r.ativo===false?'Inativo':'Ativo'}</span></td></tr>)}</tbody></table></div>:<div className="empty">{empty}</div>}</div>
}

function Footer(){return <footer className="footer"><div><b>♻ SIMUL</b><p>Sistema Integrado de Monitoramento Urbano de Limpeza.</p></div><div><span>Projeto acadêmico · FATESG SENAI</span><small>Informações de coleta sujeitas aos dados cadastrados no sistema.</small></div></footer>}

export default App
