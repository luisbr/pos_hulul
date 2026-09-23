Rails.application.routes.draw do
  namespace :api do
    get "health", to: "health#show"
    post "session", to: "sessions#create"
    resource :profile, only: %i[show update]

    namespace :admin do
      resources :businesses, only: %i[index show create update] do
        resources :branches, only: %i[create update]
        resources :users, only: %i[create update]
      end
    end

    namespace :portal do
      resources :businesses, only: [] do
        member do
          get :context
          patch :settings
          patch :branch_settings
        end

        resource :cash_register_session, only: %i[create], controller: "cash_register_sessions" do
          get :current
          post :close
          post :force_close
        end
        resources :cash_movements, only: %i[index create]
        resources :audit_events, only: :index
        resources :catalogs, only: :index do
          collection do
            post ":catalog_type", action: :create
            patch ":catalog_type/:id", action: :update
          end
        end
        resources :customers, only: %i[index show create update]
        resources :users, only: %i[index create update]
        resources :purchases, only: %i[index show create] do
          post :cancel, on: :member
        end
        resources :suppliers, only: %i[index show create update]
        resources :inventory_movements, only: %i[index create]
        resources :products, only: %i[index show create update] do
          collection do
            get :import_template
            post :import_preview
            post :import_commit
          end
        end
        resources :sales, only: %i[index show create] do
          post :cancel, on: :member
        end
      end
    end
  end
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"
end
