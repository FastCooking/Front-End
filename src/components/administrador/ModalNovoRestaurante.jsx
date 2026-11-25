import { useState } from "react";
import {
  MdPerson,
  MdStore,
  MdVisibility,
  MdVisibilityOff,
} from "react-icons/md";
import { criarRestaurante } from "../../services/restauranteService";
import { criarUsuario } from "../../services/usuarioService";
import {
  formatarCEP,
  formatarCNPJ,
  formatarCPF,
  formatarTelefone,
} from "../../utils/formatters";
import { validarSenhaForte } from "../../utils/validacaoSenha";
import { Button, Field, Input, Modal, Select } from "../ui";

function ModalNovoRestaurante({ onClose, onSuccess }) {
  const [nomeRestaurante, setNomeRestaurante] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [emailRestaurante, setEmailRestaurante] = useState("");
  const [cep, setCep] = useState("");

  const [nomeUsuario, setNomeUsuario] = useState("");
  const [cpf, setCpf] = useState("");
  const [emailUsuario, setEmailUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [funcao, setFuncao] = useState("Gerente");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (
      !nomeRestaurante.trim() ||
      !cnpj.trim() ||
      !telefone.trim() ||
      !emailRestaurante.trim() ||
      !cep.trim() ||
      !nomeUsuario.trim() ||
      !cpf.trim() ||
      !emailUsuario.trim() ||
      !senha.trim()
    ) {
      setErro("Todos os campos marcados com * são obrigatórios.");
      return;
    }

    if (cnpj.replace(/\D/g, "").length !== 14) {
      setErro("O CNPJ deve conter exatamente 14 dígitos.");
      return;
    }

    if (cpf.replace(/\D/g, "").length !== 11) {
      setErro("O CPF deve conter exatamente 11 dígitos.");
      return;
    }

    if (cep.replace(/\D/g, "").length !== 8) {
      setErro("O CEP deve conter 8 dígitos.");
      return;
    }

    const erroSenha = validarSenhaForte(senha);
    if (erroSenha) {
      setErro(erroSenha);
      return;
    }

    setCarregando(true);

    try {
      const restCriado = await criarRestaurante({
        nome: nomeRestaurante.trim(),
        cnpj,
        telefone,
        email: emailRestaurante.trim(),
        cep,
        status: true,
      });

      await criarUsuario({
        idRestaurante: restCriado.idRestaurante,
        nome: nomeUsuario.trim(),
        cpf,
        email: emailUsuario.trim(),
        senha,
        funcao,
        status: true,
      });

      onSuccess();
    } catch (err) {
      setErro(
        err.message || "Não foi possível cadastrar o restaurante e usuário."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Novo Restaurante & Gestor"
      icon={MdStore}
      size="2xl"
    >
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl mb-4 text-xs sm:text-sm font-medium">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gold mb-3 flex items-center gap-1.5">
            <MdStore size={16} /> Dados do Restaurante
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nome do Restaurante" required>
              <Input
                type="text"
                required
                maxLength={255}
                value={nomeRestaurante}
                onChange={(e) => setNomeRestaurante(e.target.value)}
                placeholder="Ex: FastCooking Matriz"
              />
            </Field>

            <Field label="CNPJ" required>
              <Input
                type="text"
                required
                maxLength={18}
                value={cnpj}
                onChange={(e) => setCnpj(formatarCNPJ(e.target.value))}
                placeholder="00.000.000/0000-00"
              />
            </Field>

            <Field label="Telefone" required>
              <Input
                type="text"
                required
                maxLength={15}
                value={telefone}
                onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                placeholder="(11) 99999-9999"
              />
            </Field>

            <Field label="E-mail do Restaurante" required>
              <Input
                type="email"
                required
                maxLength={255}
                value={emailRestaurante}
                onChange={(e) => setEmailRestaurante(e.target.value)}
                placeholder="contato@restaurante.com"
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="CEP" required>
                <Input
                  type="text"
                  required
                  maxLength={9}
                  value={cep}
                  onChange={(e) => setCep(formatarCEP(e.target.value))}
                  placeholder="00000-000"
                />
              </Field>
            </div>
          </div>
        </div>

        <div className="border-t pt-4 border-gray-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gold mb-3 flex items-center gap-1.5">
            <MdPerson size={16} /> Usuário Inicial Vinculado
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nome do Usuário" required>
              <Input
                type="text"
                required
                maxLength={255}
                value={nomeUsuario}
                onChange={(e) => setNomeUsuario(e.target.value)}
                placeholder="Ex: Carlos Silva"
              />
            </Field>

            <Field label="CPF" required>
              <Input
                type="text"
                required
                maxLength={14}
                value={cpf}
                onChange={(e) => setCpf(formatarCPF(e.target.value))}
                placeholder="000.000.000-00"
              />
            </Field>

            <Field label="E-mail (Login)" required>
              <Input
                type="email"
                required
                maxLength={255}
                value={emailUsuario}
                onChange={(e) => setEmailUsuario(e.target.value)}
                placeholder="carlos@restaurante.com"
              />
            </Field>

            <Field label="Função / Cargo" required>
              <Select value={funcao} onChange={(e) => setFuncao(e.target.value)}>
                <option value="Gerente">Gerente</option>
                <option value="Adm">Adm</option>
                <option value="Garcom">Garçom</option>
                <option value="Cozinheiro">Cozinheiro</option>
              </Select>
            </Field>

            <div className="md:col-span-2">
              <Field
                label="Senha de Acesso"
                required
                hint="Mínimo de 8 caracteres, contendo letras e números."
              >
                <div className="relative">
                  <Input
                    type={mostrarSenha ? "text" : "password"}
                    required
                    minLength={8}
                    maxLength={128}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite uma senha forte"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                    aria-label="Alternar visibilidade da senha"
                  >
                    {mostrarSenha ? (
                      <MdVisibilityOff size={18} />
                    ) : (
                      <MdVisibility size={18} />
                    )}
                  </button>
                </div>
              </Field>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={carregando}>
            Cadastrar Restaurante e Usuário
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ModalNovoRestaurante;
