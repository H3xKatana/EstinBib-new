'use client'
import { signIn, SignInResponse } from "next-auth/react";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { Lock, CreditCard, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Image from "next/image";
import { ArrowRight, Loader } from 'lucide-react';

const LoginForm = () => {
  const [numeroDeBac, setNumeroDeBac] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!numeroDeBac || !password) {
      setError("Veuillez entrer votre numéro de bac et votre mot de passe");
      return;
    }

    // Basic validation for numero de bac (should be alphanumeric)
    const bacNumberRegex = /^[A-Za-z0-9]+$/;
    if (!bacNumberRegex.test(numeroDeBac)) {
      setError("Le numéro de bac ne doit contenir que des lettres et des chiffres");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response: SignInResponse | undefined = await signIn("credentials", {
        numeroDeBac,
        password,
        redirect: false,
      });

      if (response?.error) {
        if (response.error === "Aucun utilisateur trouvé avec ce numéro de bac") {
          setError("Numéro de bac non trouvé");
        } else if (response.error === "Mot de passe incorrect") {
          setError("Mot de passe incorrect");
        } else {
          setError("Numéro de bac ou mot de passe incorrect");
        }
      } else if (response?.ok) {
        // Successful login
        router.push("/profile");
        router.refresh(); // Refresh to update session
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Une erreur s'est produite lors de la connexion. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    
    try {
      const response: SignInResponse | undefined = await signIn("google", { 
        redirect: false,
        callbackUrl: "/profile" 
      });
      
      if (response?.error) {
        setError("Échec de la connexion avec Google");
      } else if (response?.ok) {
        router.push("/profile");
        router.refresh();
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError("Une erreur s'est produite avec la connexion Google. Veuillez réessayer.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
        <div className="space-y-4 w-full">
          <div>
            <label htmlFor="numeroDeBac" className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de Bac
            </label>
            <div className="relative">
              <CreditCard className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="numeroDeBac"
                type="text"
                value={numeroDeBac}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumeroDeBac(e.target.value.toUpperCase())}
                placeholder="Ex: AB123456"
                className="w-full pl-10 pr-4 h-[58px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                required
                disabled={isLoading}
                maxLength={20}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Entrez votre numéro de baccalauréat unique
            </p>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                placeholder="Entrez votre mot de passe"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 h-[58px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500 focus:outline-none"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#F1413E] flex flex-row justify-center items-center text-white py-3 rounded-[14px] font-medium hover:bg-[#D63936] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader className="animate-spin w-4 h-4 mr-2" />
              Connexion en cours...
            </>
          ) : (
            <>
              Accéder à mon compte
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </button>
      </form>

      <div className="flex flex-col space-y-6">
        <div className="mt-6 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Ou continuer avec
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center px-4 h-[48px] border border-gray-300 rounded-[14px] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isGoogleLoading || isLoading}
          >
            {isGoogleLoading ? (
              <Loader className="animate-spin w-5 h-5 text-gray-400" />
            ) : (
              <>
                <Image
                  src={"/svg/google.svg"}
                  height={35}
                  width={35}
                  alt="google"
                  className="m-1"
                />
                <span className="text-gray-700">Se connecter avec Google</span>
              </>
            )}
          </button>
        </div>
        <p className="text-center text-sm text-gray-600">
          Problème de connexion ?{" "}
          <a
            href="/#cotnact"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Obtenir de l'aide
          </a>
        </p>
      </div>
    </>
  );
};

export default LoginForm;