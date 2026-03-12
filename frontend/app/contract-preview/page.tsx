"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth-service";
import { contractService } from "@/lib/contract-service";
import type { UserData } from "@/lib/types";
import { AlertTriangle, Check } from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────
function formatDate(date: string | Date | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Template Stagiaire ──────────────────────────────────────
function ContratStagiaire({ user }: { user: UserData }) {
  return (
    <div className="contract-body">
      <p className="type">CONTRAT DE STAGE</p>
      <h1 className="center">ENTRE LES SOUSSIGNÉS :</h1>

      <p><strong style={{textTransform:"uppercase"}}>{user.nom} {user.prenoms}</strong>,</p>
      <p>CIN : <strong>{user.cin}</strong></p>
      <p>Domicilié à : <strong>{user.adresse}</strong></p>
      <p>ci-après dénommé « le Stagiaire ».</p>
      <p>ET</p>
      <p>
        Code Talent, société immatriculée au RCS de 2025 B 00136 à Antananarivo,
        Nifstat : 3019107233 62011-11-2025-0-10138, dont le siège social est sis
        Moufadal Center Antananarivo Madagascar, représentée par Mme
        ANDRIAMAMPIANINA Angelinah Myriame, en sa qualité de Fondatrice,
        ci-après dénommée « le Client ».
      </p>

      <h1>Article 1 - Objet</h1>
      <p>
        Le présent contrat a pour objet de définir les conditions dans lesquelles le
        Stagiaire effectuera <strong>{user.poste}</strong> au sein de l'Entreprise,
        dans le cadre d'un projet client.
      </p>

      <h1>Article 2. Durée</h1>
      <p>
        Le stage débute le <strong>{formatDate(user.dateDebut)}</strong> et se
        poursuit pour une durée{" "}
        {user.dateFin && !user.dateFinIndeterminee ? (
          <>déterminée jusqu'au <strong>{formatDate(user.dateFin)}</strong>.</>
        ) : (
          <strong>indéterminée</strong>
        )}
        . Toute prolongation éventuelle devra faire l'objet d'un avenant écrit et
        signé par les deux parties.
      </p>

      <h1>Article 3 – Lieu</h1>
      <p>
        Le stage s'effectuera principalement dans les locaux de l'Entreprise à
        Antananarivo, Madagascar, avec possibilité de missions ponctuelles en
        télétravail, selon les besoins du projet.
      </p>

      <h1>Article 4 – Encadrement</h1>
      <p>
        Le Stagiaire sera encadré par un responsable technique de Code Talent et
        bénéficiera d'un suivi hebdomadaire afin d'assurer la bonne réalisation de
        ses missions.
      </p>
      <p>
        Le Stagiaire percevra une indemnité mensuelle de{" "}
        <strong>{user.indemnite} Ariary</strong> +{" "}
        <strong>{user.indemniteConnexion} Ariary</strong> de connexion. En
        complément, l'Entreprise mettra à disposition : Un ordinateur de travail,
        Une prise en charge des repas, Une indemnité de transport.
      </p>

      <h1>Article 5. Missions</h1>
      <p>Les missions confiées au Stagiaire concerneront principalement :</p>
      <p><strong>{user.mission}</strong></p>

      <h1>Article 6. Confidentialité</h1>
      <p>
        Le Stagiaire s'interdit de divulguer, pendant et après son stage, toute
        information confidentielle relative à l'Entreprise, à ses clients ou à ses
        partenaires.
      </p>

      <h1>Article 7. Équipements</h1>
      <p>
        Le matériel fourni (ordinateur, logiciels, accès internes) demeure la
        propriété exclusive de l'Entreprise et devra être restitué à la fin du
        stage en parfait état.
      </p>

      <h1>Article 8. Attestation et avenir professionnel</h1>
      <p>
        À l'issue du stage, le Stagiaire recevra une attestation de stage.
        Selon les résultats et les opportunités, une proposition d'alternance ou
        de collaboration pourra être étudiée.
      </p>

      <h1>Article 9. Résiliation</h1>
      <p>
        En cas de manquement grave aux obligations, chacune des parties pourra
        mettre fin au présent contrat moyennant un préavis écrit de 7 jours.
      </p>

      {/* Zone signature — sans signature utilisateur */}
      <div className="signature-section">
        <p>Fait à Antananarivo, le <strong>{formatDate(new Date().toISOString())}</strong></p>
        <div className="sig-row">
          <div>
            <p>Pour l'Entreprise,</p>
            <p>Mme Myriame Angelinah</p>
            <p>Gérante – Code Talent SARL</p>
            <img 
              src="/images/sign.png" 
              alt="Signature Direction" 
              style={{ width: "220px", marginTop: "12px" }} 
            />
            </div>
          <div>
            <p>Pour le Stagiaire,</p>
            <div className="sig-placeholder sig-empty">
              Votre signature apparaîtra ici après génération
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Template Prestataire ────────────────────────────────────
function ContratPrestataire({ user }: { user: UserData }) {
  return (
    <div className="contract-body">
      <p className="type">CONTRAT DE PRESTATION DE SERVICES</p>
      <h1 className="center">ENTRE LES SOUSSIGNÉS :</h1>

      <p><strong style={{textTransform:"uppercase"}}>{user.nom} {user.prenoms}</strong>,</p>
      <p>CIN : <strong>{user.cin}</strong></p>
      <p>Domicilié à : <strong>{user.adresse}</strong></p>
      <p>ci-après dénommé « le Prestataire consultant ».</p>
      <p>ET</p>
      <p>
        Code Talent, société immatriculée au RCS de 2025 B 00136 à Antananarivo,
        Nifstat : 3019107233 62011-11-2025-0-10138, dont le siège social est sis
        Moufadal Center Antananarivo Madagascar, représentée par Mme
        ANDRIAMAMPIANINA Angelinah Myriame, en sa qualité de Fondatrice,
        ci-après dénommée « le Client ».
      </p>

      <h1>Article 1. Objet de la prestation</h1>
      <p>
        Le présent Contrat a pour objet la fourniture de prestation de SERVICE
        INFORMATIQUE par le Prestataire, pour le bénéfice du Client. Ces prestations
        couvrent le domaine de <strong>{user.domainePrestation}</strong>.
      </p>

      <h1>Article 2. Durée</h1>
      <p>
        Le contrat entre en vigueur à compter du{" "}
        <strong>{formatDate(user.dateDebut)}</strong> et se poursuit pour une durée{" "}
        {user.dateFin && !user.dateFinIndeterminee ? (
          <>déterminée jusqu'au <strong>{formatDate(user.dateFin)}</strong>.</>
        ) : (
          <strong>indéterminée</strong>
        )}
        . Il sera renouvelable par accord exprès et écrit des Parties.
      </p>

      <h1>Article 3. Nombre de jours de prestation</h1>
      <p>
        Le nombre de jours de prestation fournis par le Prestataire est convenu à{" "}
        <strong>{user.nombreJour} jours</strong> par semaine à{" "}
        <strong>{user.horaire}</strong>.
      </p>
      <p>
        Selon les besoins du Client et la disponibilité du Prestataire, ce nombre
        pourra être ajusté de mois en mois avec l'accord des Parties.
      </p>

      <h1>Article 4. Tarifs et conditions de paiement</h1>
      <p>
        Les prestations définies à l'article 1 ci-dessus seront facturées au Client{" "}
        <strong>{user.tjm} ariary</strong> par jour de{" "}
        <strong>{user.dureeJournaliere}H</strong> de travail en net.
      </p>
      <p>
        Conformément à la politique de voyage et sous réserve de validation
        préalable, le Client couvrira les dépenses exceptionnelles du Prestataire
        lorsqu'il lui sera demandé de se déplacer dans l'exercice de sa mission.
      </p>
      <p>
        Le Prestataire émettra une facture mensuelle accompagnée du détail de ses
        jours d'intervention et de ses dépenses exceptionnelles. Cette facture est
        payable dans les 15 jours à compter de sa réception.
      </p>

      <h1>Article 5. Lieu de la prestation</h1>
      <p>
        Le présent Contrat est réalisé depuis les locaux du Prestataire et/ou en
        télétravail. Ce dernier réalisera ses prestations à l'aide de ses propres
        équipements et outils mais en cas de besoin un outil sera à sa disposition.
      </p>
      <p>Le Prestataire déterminera le moment, le lieu et l'ordre dans lequel il exécutera les prestations.</p>

      <h1>Article 6. Confidentialité</h1>
      <p>
        Le Prestataire s'engage à traiter de façon strictement confidentielle toute
        information, document ou donnée du Client dont il aura pu avoir connaissance
        à l'occasion de l'exécution de ses prestations. Cette obligation vaut pendant
        toute la durée et après 2 ans après l'expiration du présent Contrat.
      </p>

      <h1>Article 7. Publicité</h1>
      <p>
        Le Prestataire ne pourra faire état auprès de quiconque des travaux réalisés
        chez le Client, sans un accord préalable écrit de ce dernier.
      </p>

      <h1>Article 8. Résiliation</h1>
      <p>
        Le présent Contrat pourra être résilié à tout moment par chacune des Parties,
        sans avoir à justifier d'un motif, par tout moyen et en respectant un délai
        de préavis de 14 jours calendaires.
      </p>
      <p>
        En cas de résiliation, le Prestataire aura droit au paiement de toute
        fraction de la prestation réalisée conformément au présent Contrat.
      </p>

      <h1>Article 9. Clause de non-concurrence</h1>
      <p>
        À l'échéance ou en cas de rupture du présent Contrat pour quelque cause que
        ce soit, le Prestataire s'engage à ne pas réaliser de prestation de service
        qui serait directement en concurrence avec l'activité du Client. La présente
        interdiction s'applique pendant une durée de 24 mois à compter de la
        cessation du Contrat.
      </p>

      <h1>Article 10. Clause de non-sollicitation</h1>
      <p>
        Le Prestataire s'engage à ne pas recruter ou embaucher tout collaborateur du
        Client pendant la durée d'exécution de celui-ci et pendant une durée de 24
        mois à compter de sa cessation.
      </p>

      <h1>Article 11. Cession des droits de Propriété intellectuelle</h1>
      <p>
        Cette prestation est réalisée selon des spécifications et un cahier des
        charges fournis par le Client. Dans ce cadre, le Prestataire peut être amené
        à générer des livrables afférents à cette prestation, en ce compris tout
        logiciel et développement logiciel, dans toutes leurs composantes (code
        source, code objet, interfaces, architecture et documentation...).
      </p>
      <p>
        En contrepartie d'un montant forfaitaire compris dans sa rémunération, le
        Prestataire cède au Client l'ensemble des Droits de Propriété Intellectuelle
        sur les Livrables pour la durée de protection définie par les lois
        applicables, et ce pour le monde entier.
      </p>

      <h1>Article 12. Garantie</h1>
      <p>
        Le Prestataire garantit le Client contre toute action ou réclamation de la
        part de tout tiers invoquant un droit de propriété intellectuelle ou un acte
        de concurrence et/ou parasitaire.
      </p>

      <h1>Article 13. Protection des données personnelles</h1>
      <p>
        Pour tout traitement de données personnelles effectué en relation avec ce
        Contrat, les Parties se conformeront au règlement (UE) 2016/679 (RGPD).
      </p>

      <h1>Article 14. Cession du Contrat - Sous-traitance</h1>
      <p>
        Le Prestataire ne pourra pas transférer, céder ou apporter à un tiers, sous
        quelque forme que ce soit, tout ou partie de ses droits ou obligations nés du
        présent Contrat, sans l'accord exprès et préalable du Client.
      </p>

      <h1>Article 15. Droit applicable</h1>
      <p>
        Le présent contrat est régi par le droit Malagasy. En cas de litige, le
        tribunal compétent sera le Tribunal de Madagascar.
      </p>

      {/* Zone signature — sans signature utilisateur */}
      <div className="signature-section">
        <p>Fait à Antananarivo, le <strong>{formatDate(new Date().toISOString())}</strong></p>
        <div className="sig-row">
          <div>
            <p>Pour l'Entreprise,</p>
            <p>Mme Myriame Angelinah</p>
            <p>Gérante – Code Talent SARL</p>
            <img 
              src="/images/sign.png" 
              alt="Signature Direction" 
              style={{ width: "220px", marginTop: "12px" }} 
            />
          </div>
          <div>
            <p>Pour le Prestataire,</p>
            <div className="sig-placeholder sig-empty">
              Votre signature apparaîtra ici après génération
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────
export default function ContractPreviewPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authService.getProfile().then(setUser).finally(() => setIsLoading(false));
  }, []);

  const handleGenerate = async () => {
    if (!user) return;
    setIsGenerating(true);
    try {
      const token = localStorage.getItem("authToken");
      // Générer contrat
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/contracts/generate-after-signup/${user._id}`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      // Générer NDA
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ndas/generate/${user._id}`,
        { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      // Mettre à jour contractPending = false
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${user._id}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ contractPending: false }),
        }
      );
      router.push("/home");
    } catch (e) {
      alert("Erreur lors de la génération du contrat.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>Chargement du contrat...</p>
    </div>
  );

  if (!user) return null;

  return (
    <>
      <style>{`
        /* ── Reset & base ── */
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #1a1a2e; }

        /* ── Wrapper page ── */
        .preview-wrapper {
          min-height: 100vh;
          background: #0f0f12;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 32px 16px 80px;
        }

        /* ── Topbar ── */
        .topbar {
          width: 100%;
          max-width: 860px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
        }
        .topbar-title {
          color: #fff;
          font-size: 18px;
          font-weight: 700;
        }
        .btn-back {
          display: flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: 1px solid #313442;
          color: #aaa;
          border-radius: 6px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 13px;
          transition: all .2s;
        }
        .btn-back:hover { border-color: #6C4EA8; color: #fff; }

        /* ── Feuille A4 ── */
        .a4-sheet {
          width: 100%;
          max-width: 860px;
          background: #fff;
          border-radius: 4px;
          box-shadow: 0 8px 40px rgba(0,0,0,.5);
          overflow: hidden;
        }

        /* ── Header bande violette ── */
        .doc-header-bar {
          height: 14px;
          background: #300A46;
          width: 100%;
        }
        .doc-header-logo {
          text-align: center;
          padding: 14px 0 4px;
          border-bottom: 1px solid #e8e8e8;
        }
        .doc-header-logo img { height: 48px; }
        .doc-header-logo .logo-placeholder {
          display: inline-block;
          width: 80px;
          height: 40px;
          border-radius: 4px;
        }

        /* ── Corps du document ── */
        .contract-body {
          padding: 40px 52px;
          font-family: "Montserrat", "Segoe UI", sans-serif;
          font-size: 12pt;
          line-height: 1.7;
          color: #1E1E1E;
        }

        .contract-body .type {
          text-align: center;
          font-weight: 700;
          color: #300A46;
          text-transform: uppercase;
          font-size: 13pt;
          margin-bottom: 18px;
        }

        .contract-body h1 {
          font-size: 14pt;
          color: #300A46;
          font-weight: 800;
          margin-top: 36px;
          margin-bottom: 8px;
          border-left: 3px solid #300A46;
          padding-left: 10px;
        }

        .contract-body p {
          font-size: 11.5pt;
          text-align: justify;
          margin: 5px 0 5px 14px;
          color: #222;
        }

        .contract-body .center { text-align: center; }

        /* ── Section signature ── */
        .signature-section {
          margin-top: 52px;
          padding-top: 24px;
          border-top: 1px solid #ddd;
        }
        .signature-section > p {
          margin-left: 0;
          margin-bottom: 28px;
          font-size: 11pt;
          color: #444;
        }
        .sig-row {
          display: flex;
          justify-content: space-between;
          gap: 32px;
        }
        .sig-row > div { width: 45%; }
        .sig-row p { margin-left: 0; font-size: 11pt; }

        .sig-placeholder {
          margin-top: 20px;
          height: 64px;
          border: 1.5px dashed #ccc;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10pt;
          color: #999;
          background: #fafafa;
        }
        .sig-empty {
          border-color: #6C4EA8;
          color: #6C4EA8;
          font-style: italic;
          background: #f5f0ff;
        }

        /* ── Footer document ── */
        .doc-footer {
          height: 10px;
          background: #300A46;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 32px;
        }
        .doc-footer span { color: #fff; font-size: 9pt; }

        /* ── Bandeau d'information ── */
        .info-banner {
          width: 100%;
          max-width: 860px;
          margin-top: 20px;
          background: #1F2128;
          border: 1px solid #313442;
          border-radius: 10px;
          padding: 18px 22px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .info-banner .icon { font-size: 22px; flex-shrink: 0; margin-top: 2px; }
        .info-banner p { color: #bbb; font-size: 13px; line-height: 1.6; margin: 0; }
        .info-banner strong { color: #c084fc; }

        /* ── Boutons d'action ── */
        .action-bar {
          width: 100%;
          max-width: 860px;
          display: flex;
          justify-content: flex-end;
          gap: 14px;
          margin-top: 24px;
        }
        .btn-generate {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #6C4EA8;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 12px 28px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background .2s;
        }
        .btn-generate:hover:not(:disabled) { background: #7d5fc0; }
        .btn-generate:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Loading ── */
        .loading-screen {
          min-height: 100vh;
          background: #0f0f12;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: #aaa;
        }
        .spinner {
          width: 40px; height: 40px;
          border: 3px solid #313442;
          border-top-color: #6C4EA8;
          border-radius: 50%;
          animation: spin .8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="preview-wrapper">
        {/* Topbar */}
        <div className="topbar">
          <span className="topbar-title">
            Lecture du contrat — {user.profile === "stagiaire" ? "Stage" : "Prestation"}
          </span>
          <button className="btn-back" onClick={() => router.push("/home")}>
            ← Retour
          </button>
        </div>

        {/* Feuille A4 */}
        <div className="a4-sheet">
          <div className="doc-header-bar" />
          <div className="doc-header-logo">
            <img src="/images/logo4.png" className="logo-placeholder" />
          </div>

          {user.profile === "stagiaire"
            ? <ContratStagiaire user={user} />
            : <ContratPrestataire user={user} />
          }

          <div className="doc-footer">
            <span>Code-Talent</span>
          </div>
        </div>

        {/* Bandeau info */}
        <div className="info-banner">
          <AlertTriangle style={{color: "white", width: "50px"}}/>
          <p>
            Veuillez lire attentivement votre contrat. Si certaines informations
            ne vous conviennent pas, rendez-vous dans{" "}
            <strong>l'onglet Profil</strong> du menu latéral (sidebar) pour modifier vos
            informations, puis revenez ici pour générer votre contrat.
          </p>
        </div>

        {/* Boutons */}
        <div className="action-bar">
          <button className="btn-back" onClick={() => router.push("/home")}>
            ← Retour sans signer
          </button>
          <button
            className="btn-generate"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            <Check style={{width:18,height:18}} />
            {isGenerating ? (
              <><span className="spinner" style={{width:18,height:18,borderWidth:2}} /> Génération...</>
            ) : (
              <>Signer & Générer le contrat</>
            )}
          </button>
        </div>
      </div>
    </>
  );
}