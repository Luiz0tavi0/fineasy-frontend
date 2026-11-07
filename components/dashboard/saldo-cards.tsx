import { Card } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";


type Resumo = {
    saldoAtual: number;
    saldoProjetado: number;
    aPagar: number;
    aReceber: number;
};

type SaldoCardsProps = {
    resumo: Resumo;
};

export function SaldoCards({ resumo }: SaldoCardsProps) {
    return (
        <>
            <Card title="Saldo atual">
                <p
                    className={`text-2xl font-semibold ${resumo.saldoAtual !== 0 ? "text-green-600" : ""
                        }`}
                >
                    {formatMoney(resumo.saldoAtual)}
                </p>
            </Card>

            <Card title="Saldo projetado">
                <p
                    className={`text-2xl font-semibold ${resumo.saldoProjetado < 0 ? "text-red-700" : ""
                        }`}
                >
                    {formatMoney(resumo.saldoProjetado)}
                </p>
            </Card>

            <Card title="A Pagar">
                <p className="text-2xl font-semibold text-red-700">
                    {formatMoney(resumo.aPagar)}
                </p>
            </Card>

            <Card title="A Receber">
                <p className="text-2xl font-semibold text-green-700">
                    {formatMoney(resumo.aReceber)}
                </p>
            </Card>
        </>
    );
}
export default SaldoCards