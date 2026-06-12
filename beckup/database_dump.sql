--
-- PostgreSQL database dump
--

\restrict 0y4ip0naUnFTnLgAIAspZmrgL3QwM6UPBWX7tkUS5dh8njiYMZ3Y4jV6vHSCbEA

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: discord
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'CANCELLED',
    'EXPIRED'
);


ALTER TYPE public."OrderStatus" OWNER TO discord;

--
-- Name: ProductStatus; Type: TYPE; Schema: public; Owner: discord
--

CREATE TYPE public."ProductStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE'
);


ALTER TYPE public."ProductStatus" OWNER TO discord;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: discord
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO discord;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: discord
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    "discordUserId" character varying(30) NOT NULL,
    "discordUsername" character varying(255) NOT NULL,
    action character varying(100) NOT NULL,
    entity character varying(50) NOT NULL,
    "entityId" character varying(255),
    details text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO discord;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: discord
--

CREATE TABLE public.orders (
    id character varying(30) DEFAULT ('ord_'::text || substr(md5(((random())::text || (clock_timestamp())::text)), 1, 20)) NOT NULL,
    "discordUserId" character varying(30) NOT NULL,
    "discordUsername" character varying(255) NOT NULL,
    "productId" character varying(30) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "totalPrice" numeric(10,2) NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    "paymentId" character varying(255),
    "paymentUrl" text,
    "pixKey" text,
    "expiresAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.orders OWNER TO discord;

--
-- Name: product_types; Type: TABLE; Schema: public; Owner: discord
--

CREATE TABLE public.product_types (
    id text DEFAULT ('type_'::text || substr(md5(((random())::text || (clock_timestamp())::text)), 1, 20)) NOT NULL,
    name character varying(50) NOT NULL,
    emoji character varying(10),
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.product_types OWNER TO discord;

--
-- Name: products; Type: TABLE; Schema: public; Owner: discord
--

CREATE TABLE public.products (
    id character varying(30) DEFAULT ('prod_'::text || substr(md5(((random())::text || (clock_timestamp())::text)), 1, 20)) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    category character varying(100) NOT NULL,
    type character varying(50) DEFAULT 'DIGITAL'::character varying NOT NULL,
    "imageUrl" text,
    "videoUrl" text,
    status public."ProductStatus" DEFAULT 'ACTIVE'::public."ProductStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "channelId" character varying(30)
);


ALTER TABLE public.products OWNER TO discord;

--
-- Name: rate_limits; Type: TABLE; Schema: public; Owner: discord
--

CREATE TABLE public.rate_limits (
    id text NOT NULL,
    "discordUserId" character varying(30) NOT NULL,
    action character varying(100) NOT NULL,
    count integer DEFAULT 1 NOT NULL,
    "resetAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.rate_limits OWNER TO discord;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: discord
--

INSERT INTO public._prisma_migrations VALUES ('149a6a27-1a9f-432e-9fe0-e042f135e235', 'fe83d4110fec7d625185597784e7d2feb6fa2d3f4104939885f7c560f1199229', NULL, '20260512221500_fix_product_type_column', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20260512221500_fix_product_type_column

Database error code: 42P01

Database error:
ERROR: relation "products" does not exist

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \"products\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(434), routine: Some("RangeVarGetRelidExtended") }

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20260512221500_fix_product_type_column"
             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106
   1: schema_core::commands::apply_migrations::Applying migration
           with migration_name="20260512221500_fix_product_type_column"
             at schema-engine/core/src/commands/apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine/core/src/state.rs:226', '2026-05-29 00:00:34.470059+00', '2026-05-28 23:50:42.427207+00', 0);
INSERT INTO public._prisma_migrations VALUES ('308b2fad-a878-4d06-9987-bf496a10229d', 'fe83d4110fec7d625185597784e7d2feb6fa2d3f4104939885f7c560f1199229', '2026-05-29 00:02:23.537414+00', '20260512234600_fix_product_type_column', NULL, NULL, '2026-05-29 00:02:23.4976+00', 1);
INSERT INTO public._prisma_migrations VALUES ('9ed7a7d7-d553-46c6-a7de-79b936febcca', 'fe83d4110fec7d625185597784e7d2feb6fa2d3f4104939885f7c560f1199229', NULL, '20260512221500_fix_product_type_column', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20260512221500_fix_product_type_column

Database error code: 42P01

Database error:
ERROR: relation "products" does not exist

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \"products\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(434), routine: Some("RangeVarGetRelidExtended") }

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20260512221500_fix_product_type_column"
             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106
   1: schema_core::commands::apply_migrations::Applying migration
           with migration_name="20260512221500_fix_product_type_column"
             at schema-engine/core/src/commands/apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine/core/src/state.rs:226', '2026-05-29 00:02:17.725017+00', '2026-05-29 00:00:48.091552+00', 0);
INSERT INTO public._prisma_migrations VALUES ('0b083e38-a0bb-4990-9fd1-9f51e1b95d4c', 'ef4879ae52e025d0930dc10c8fd37f1b3f8f38c16b24e52d5878acf0328d1927', '2026-05-29 00:02:23.449162+00', '20260512233735_init', NULL, NULL, '2026-05-29 00:02:23.286877+00', 1);
INSERT INTO public._prisma_migrations VALUES ('c86c92b4-32d8-4592-a819-002f6ff0fb3b', '4c30bd6ae5ceb4b43374099072b2fe6daff098611227c925559993b8cc8156b1', '2026-05-29 00:02:23.494591+00', '20260512234533_add_channel_and_product_types', NULL, NULL, '2026-05-29 00:02:23.453265+00', 1);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: discord
--

INSERT INTO public.audit_logs VALUES ('8fa23e50-f605-43ad-8cf6-19d31920e67f', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_88dc715a098d8cf034a0', NULL, '2026-05-29 18:52:17.822');
INSERT INTO public.audit_logs VALUES ('ca519686-d65d-4b7f-a09c-424c20a9bdca', '689908348614737960', 'xgsa', 'PURCHASE', 'ORDER', 'ord_d812f3c2b495fb01e470', NULL, '2026-05-29 18:53:44.536');
INSERT INTO public.audit_logs VALUES ('ff0fe437-098e-4f9a-8bd8-a45c8aea1127', '689908348614737960', 'xgsa', 'PURCHASE', 'ORDER', 'ord_93cdfd32a9dc1a725909', NULL, '2026-05-29 19:38:59.544');
INSERT INTO public.audit_logs VALUES ('1c50faac-6e1a-4061-b0a1-c15a8f94c5a2', '689908348614737960', 'xgsa', 'PURCHASE', 'ORDER', 'ord_69f6bba8e021cffc426c', NULL, '2026-05-29 20:25:24.546');
INSERT INTO public.audit_logs VALUES ('fe7a2eb7-0406-45bd-b766-aa38123d8872', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_4efce0f55e88c1ad29f5', NULL, '2026-06-01 17:24:43.44');
INSERT INTO public.audit_logs VALUES ('2541adab-c453-4082-b81e-e43e80659ccc', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_2c9da7b23b5a7cd94baf', NULL, '2026-06-01 17:25:05.115');
INSERT INTO public.audit_logs VALUES ('ef818277-2b19-4a6f-a56c-ec9119b1ae9b', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_c909ca97e6b11c811e7a', NULL, '2026-06-01 17:25:30.154');
INSERT INTO public.audit_logs VALUES ('bf791dca-df6a-4a1c-be98-f0a70260180d', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_852d0c52e051600b8060', NULL, '2026-06-01 17:25:44.197');
INSERT INTO public.audit_logs VALUES ('db137334-54f0-42f4-ab4e-266d888208c9', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_fa8e64fe6131f8dda01a', NULL, '2026-06-01 17:26:10.319');
INSERT INTO public.audit_logs VALUES ('b894a4ea-aae8-4ca7-b262-d5c9d786fb41', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_9f66822187df7947a313', NULL, '2026-06-01 17:26:28.472');
INSERT INTO public.audit_logs VALUES ('98e1af67-91a8-4850-9caf-6f70d7cee136', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_c8a87262dfe6ea86985a', NULL, '2026-06-01 17:26:52.19');
INSERT INTO public.audit_logs VALUES ('19adb187-a525-49a4-82f7-b60c214d4595', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_1325a707c8b25e1cfd1d', NULL, '2026-06-01 17:27:14.767');
INSERT INTO public.audit_logs VALUES ('a18c649f-aca2-432a-87d5-dc2cbcec1abd', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_4e31ef239a2928893586', NULL, '2026-06-01 17:29:42.549');
INSERT INTO public.audit_logs VALUES ('f8d10c94-01ae-4c60-9eab-687bb9d9668b', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_90d563b9f48c77783bcc', NULL, '2026-06-01 17:30:03.149');
INSERT INTO public.audit_logs VALUES ('6d0a4cc0-a3a5-4860-9d83-4be8c471796c', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_ee6030d8dbb743194d65', NULL, '2026-06-01 17:30:39.526');
INSERT INTO public.audit_logs VALUES ('1ace2930-a7e3-42b5-ae5f-0e61a0a86d4c', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_6da579cd0dd12c573d7e', NULL, '2026-06-01 17:31:21.745');
INSERT INTO public.audit_logs VALUES ('f160f126-fe35-459c-bee5-a69275f49183', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_410d24a03cf6a037eb02', NULL, '2026-06-01 17:31:43.002');
INSERT INTO public.audit_logs VALUES ('807b1c8c-7b13-4f9a-afea-0e561fbbb44f', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_6f2c9aa820066faae8a7', NULL, '2026-06-01 17:32:05.964');
INSERT INTO public.audit_logs VALUES ('b680c586-57d6-481a-927c-e457c369c2a8', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_dffdc19cfadea85383d4', NULL, '2026-06-01 17:32:38.316');
INSERT INTO public.audit_logs VALUES ('aeb88176-cc60-4f46-88b6-c12d1d6dcd21', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_7981c9966cb8c0928664', NULL, '2026-06-01 17:34:30.575');
INSERT INTO public.audit_logs VALUES ('acb9bf65-b5fe-4003-92bf-367c2e297953', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_860af0709cef0e63c2af', NULL, '2026-06-01 17:34:48.445');
INSERT INTO public.audit_logs VALUES ('c25f2247-8419-47df-a532-ae538435bc01', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_e44b0237285cda11033d', NULL, '2026-06-01 17:35:04.206');
INSERT INTO public.audit_logs VALUES ('b5e35982-4c7a-4ab4-937f-bab7837069a1', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_7af7f8fb1aa69f3377f7', NULL, '2026-06-01 17:35:25.628');
INSERT INTO public.audit_logs VALUES ('c9285037-eb89-45f0-8835-101a5cbc3fe5', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_a8f330e01c09c2c1fa18', NULL, '2026-06-01 17:35:51.605');
INSERT INTO public.audit_logs VALUES ('0ef8cf23-d7fe-42c5-b0b5-dc7bbad0ce0b', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_551dd417cbc037047687', NULL, '2026-06-01 17:36:18.628');
INSERT INTO public.audit_logs VALUES ('492cee84-2f08-4674-8ab7-12f2ccdf2124', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_621b855e68e24d71892e', NULL, '2026-06-01 17:36:39.807');
INSERT INTO public.audit_logs VALUES ('9ea00a96-3c23-4f19-b9c6-b20edb30eb54', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_11b89290d69b306a200c', NULL, '2026-06-01 17:38:38.246');
INSERT INTO public.audit_logs VALUES ('ae410890-bb3f-40fd-938e-ecb79b04d1ce', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_268226fc175dfcec3045', NULL, '2026-06-01 17:39:00.388');
INSERT INTO public.audit_logs VALUES ('b1064025-52a3-4ece-ac56-c51e9c6eec13', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_25f2a81740d4afa09c5e', NULL, '2026-06-01 17:39:15.973');
INSERT INTO public.audit_logs VALUES ('58deac9e-09a5-4cc3-bd30-f2566af77651', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_da354e7e94bb5d30dc6c', NULL, '2026-06-01 17:39:41.324');
INSERT INTO public.audit_logs VALUES ('c0d7eb5f-e546-42d0-ad2b-2a7ee71e767e', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_5cf19a9ec9a74394a552', NULL, '2026-06-01 17:39:57.566');
INSERT INTO public.audit_logs VALUES ('340fe8dc-beb4-4d94-964f-5479a9325f0a', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_5a6b08db7ab59c27d7be', NULL, '2026-06-01 17:40:16.818');
INSERT INTO public.audit_logs VALUES ('55078617-77d7-4b4f-a6ab-7eb6273447b1', '689908348614737960', 'xgsa', 'CREATE_PRODUCT', 'PRODUCT', 'prod_9e49cb32c6a564a68654', NULL, '2026-06-01 17:40:31.209');
INSERT INTO public.audit_logs VALUES ('a56cbdb2-005b-402f-ab05-fb3ba826820a', '689908348614737960', 'xgsa', 'PURCHASE', 'ORDER', 'ord_f551463ef537a49fecf9', NULL, '2026-06-01 17:59:08.405');


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: discord
--

INSERT INTO public.orders VALUES ('ord_d812f3c2b495fb01e470', '689908348614737960', 'xgsa', 'prod_88dc715a098d8cf034a0', 1, 1.00, 'CANCELLED', NULL, NULL, NULL, '2026-05-29 19:03:44.529', NULL, '2026-05-29 18:53:44.529', '2026-05-29 19:38:43.631');
INSERT INTO public.orders VALUES ('ord_93cdfd32a9dc1a725909', '689908348614737960', 'xgsa', 'prod_88dc715a098d8cf034a0', 1, 1.00, 'CANCELLED', NULL, NULL, NULL, '2026-05-29 19:48:59.534', NULL, '2026-05-29 19:38:59.534', '2026-05-29 19:44:06.298');
INSERT INTO public.orders VALUES ('ord_69f6bba8e021cffc426c', '689908348614737960', 'xgsa', 'prod_88dc715a098d8cf034a0', 1, 1.00, 'CANCELLED', NULL, NULL, NULL, '2026-05-29 20:35:24.53', NULL, '2026-05-29 20:25:24.531', '2026-05-29 20:25:34.686');
INSERT INTO public.orders VALUES ('ord_f551463ef537a49fecf9', '689908348614737960', 'xgsa', 'prod_11b89290d69b306a200c', 1, 15.00, 'CANCELLED', NULL, NULL, NULL, '2026-06-01 18:09:08.398', NULL, '2026-06-01 17:59:08.399', '2026-06-01 17:59:18.904');


--
-- Data for Name: product_types; Type: TABLE DATA; Schema: public; Owner: discord
--



--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: discord
--

INSERT INTO public.products VALUES ('prod_7981c9966cb8c0928664', '1K DE SEGUIDORES MUNDIAIS', '1K DE SEGUIDORES MUNDIAIS', 10.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:34:30.57', '2026-06-01 17:34:30.57', '1511057355452846291');
INSERT INTO public.products VALUES ('prod_860af0709cef0e63c2af', '2K DE SEGUIDORES MUNDIAIS', '2K DE SEGUIDORES MUNDIAIS', 25.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:34:48.438', '2026-06-01 17:34:48.438', '1511057355452846291');
INSERT INTO public.products VALUES ('prod_e44b0237285cda11033d', '3K DE SEGUIDORES MUNDIAIS', '3K DE SEGUIDORES MUNDIAIS', 30.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:35:04.201', '2026-06-01 17:35:04.201', '1511057355452846291');
INSERT INTO public.products VALUES ('prod_88dc715a098d8cf034a0', 'teste', 'asdasd', 1.00, 2, 'teste', 'ITEMS', NULL, NULL, 'ACTIVE', '2026-05-29 18:52:17.814', '2026-05-29 20:25:34.678', '1509982635076878458');
INSERT INTO public.products VALUES ('prod_4efce0f55e88c1ad29f5', '10k DE CURTIDAS', '10K DE CURTIDAS', 8.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:24:43.434', '2026-06-01 17:24:43.434', '1511057259101163711');
INSERT INTO public.products VALUES ('prod_2c9da7b23b5a7cd94baf', '20k DE CURTIDAS', '20K DE CURTIDAS', 19.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:25:05.101', '2026-06-01 17:25:05.101', '1511057259101163711');
INSERT INTO public.products VALUES ('prod_c909ca97e6b11c811e7a', '30k DE CURTIDAS', '30K DE CURTIDAS', 25.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:25:30.149', '2026-06-01 17:25:30.149', '1511057259101163711');
INSERT INTO public.products VALUES ('prod_852d0c52e051600b8060', '40k DE CURTIDAS', '40K DE CURTIDAS', 35.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:25:44.193', '2026-06-01 17:25:44.193', '1511057259101163711');
INSERT INTO public.products VALUES ('prod_fa8e64fe6131f8dda01a', '50k DE CURTIDAS', '50K DE CURTIDAS', 40.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:26:10.315', '2026-06-01 17:26:10.315', '1511057259101163711');
INSERT INTO public.products VALUES ('prod_9f66822187df7947a313', '60k DE CURTIDAS', '60K DE CURTIDAS', 45.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:26:28.466', '2026-06-01 17:26:28.466', '1511057259101163711');
INSERT INTO public.products VALUES ('prod_c8a87262dfe6ea86985a', '70k DE CURTIDAS', '70K DE CURTIDAS', 50.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:26:52.186', '2026-06-01 17:26:52.186', '1511057259101163711');
INSERT INTO public.products VALUES ('prod_1325a707c8b25e1cfd1d', '80k DE CURTIDAS', '80K DE CURTIDAS', 65.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:27:14.762', '2026-06-01 17:27:14.762', '1511057259101163711');
INSERT INTO public.products VALUES ('prod_4e31ef239a2928893586', '1500 CURTIDAS + 1500 SEGUIDORES', '1500 CURTIDAS + 1500 SEGUIDORES', 35.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:29:42.544', '2026-06-01 17:29:42.544', '1511058829792772166');
INSERT INTO public.products VALUES ('prod_90d563b9f48c77783bcc', '2500 CURTIDAS + 2500 SEGUIDORES', '2500 CURTIDAS + 2500 SEGUIDORES', 45.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:30:03.144', '2026-06-01 17:30:03.144', '1511058829792772166');
INSERT INTO public.products VALUES ('prod_ee6030d8dbb743194d65', '3500 CURTIDAS + 3500 SEGUIDORES', '3500 CURTIDAS + 3500 SEGUIDORES', 55.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:30:39.513', '2026-06-01 17:30:39.513', '1511058829792772166');
INSERT INTO public.products VALUES ('prod_6da579cd0dd12c573d7e', '4500 CURTIDAS + 4500 SEGUIDORES', '4500 CURTIDAS + 4500 SEGUIDORES', 75.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:31:21.739', '2026-06-01 17:31:21.739', '1511058829792772166');
INSERT INTO public.products VALUES ('prod_410d24a03cf6a037eb02', '5500 CURTIDAS + 5500 SEGUIDORES', '5500 CURTIDAS + 5500 SEGUIDORES', 85.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:31:42.997', '2026-06-01 17:31:42.997', '1511058829792772166');
INSERT INTO public.products VALUES ('prod_6f2c9aa820066faae8a7', '6500 CURTIDAS + 6500 SEGUIDORES', '6500 CURTIDAS + 6500 SEGUIDORES', 95.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:32:05.959', '2026-06-01 17:32:05.959', '1511058829792772166');
INSERT INTO public.products VALUES ('prod_dffdc19cfadea85383d4', '7500 CURTIDAS + 7500 SEGUIDORES', '7500 CURTIDAS + 7500 SEGUIDORES', 140.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:32:38.309', '2026-06-01 17:32:38.309', '1511058829792772166');
INSERT INTO public.products VALUES ('prod_7af7f8fb1aa69f3377f7', '4K DE SEGUIDORES MUNDIAIS', '4K DE SEGUIDORES MUNDIAIS', 35.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:35:25.623', '2026-06-01 17:35:25.623', '1511057355452846291');
INSERT INTO public.products VALUES ('prod_a8f330e01c09c2c1fa18', '5K DE SEGUIDORES MUNDIAIS', '5K DE SEGUIDORES MUNDIAIS', 40.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:35:51.592', '2026-06-01 17:35:51.592', '1511057355452846291');
INSERT INTO public.products VALUES ('prod_551dd417cbc037047687', '6K DE SEGUIDORES MUNDIAIS', '6K DE SEGUIDORES MUNDIAIS', 45.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:36:18.623', '2026-06-01 17:36:18.623', '1511057355452846291');
INSERT INTO public.products VALUES ('prod_621b855e68e24d71892e', '7K DE SEGUIDORES MUNDIAIS', '7K DE SEGUIDORES MUNDIAIS', 50.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:36:39.801', '2026-06-01 17:36:39.801', '1511057355452846291');
INSERT INTO public.products VALUES ('prod_268226fc175dfcec3045', '2300 SEGUIDORES BRASILEIROS', '2300 SEGUIDORES 100% BRASILEIROS', 25.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:39:00.383', '2026-06-01 17:39:00.383', '1511050228445216778');
INSERT INTO public.products VALUES ('prod_25f2a81740d4afa09c5e', '3300 SEGUIDORES BRASILEIROS', '3300 SEGUIDORES 100% BRASILEIROS', 35.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:39:15.968', '2026-06-01 17:39:15.968', '1511050228445216778');
INSERT INTO public.products VALUES ('prod_da354e7e94bb5d30dc6c', '4300 SEGUIDORES BRASILEIROS', '4300 SEGUIDORES 100% BRASILEIROS', 45.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:39:41.319', '2026-06-01 17:39:41.319', '1511050228445216778');
INSERT INTO public.products VALUES ('prod_5cf19a9ec9a74394a552', '5300 SEGUIDORES BRASILEIROS', '5300 SEGUIDORES 100% BRASILEIROS', 50.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:39:57.558', '2026-06-01 17:39:57.558', '1511050228445216778');
INSERT INTO public.products VALUES ('prod_5a6b08db7ab59c27d7be', '6300 SEGUIDORES BRASILEIROS', '6300 SEGUIDORES 100% BRASILEIROS', 65.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:40:16.813', '2026-06-01 17:40:16.813', '1511050228445216778');
INSERT INTO public.products VALUES ('prod_9e49cb32c6a564a68654', '7300 SEGUIDORES BRASILEIROS', '7300 SEGUIDORES 100% BRASILEIROS', 70.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:40:31.205', '2026-06-01 17:40:31.205', '1511050228445216778');
INSERT INTO public.products VALUES ('prod_11b89290d69b306a200c', '1300 SEGUIDORES BRASILEIROS', '1300 SEGUIDORES 100% BRASILEIROS', 15.00, 100, 'METRICAS', 'DIGITAL', 'https://media.discordapp.net/attachments/1503813455449296917/1511057810899603496/image.png?ex=6a1f11c0&is=6a1dc040&hm=36151eed45c49baba899b9de425cdfc89dbaa5f92081ad26844b9c892860f4d3&=&format=webp&quality=lossless&width=694&height=694', NULL, 'ACTIVE', '2026-06-01 17:38:38.241', '2026-06-01 17:59:18.899', '1511050228445216778');


--
-- Data for Name: rate_limits; Type: TABLE DATA; Schema: public; Owner: discord
--

INSERT INTO public.rate_limits VALUES ('ca37fea6-0009-4f3b-8ade-54b9f26fce74', '689908348614737960', 'checkout', 1, '2026-05-29 18:54:14.51', '2026-05-29 18:53:44.522', '2026-05-29 18:53:44.522');
INSERT INTO public.rate_limits VALUES ('e4fd67f8-4e9b-4182-8a0a-e8a1b0938ef9', '689908348614737960', 'checkout', 1, '2026-05-29 19:39:29.522', '2026-05-29 19:38:59.525', '2026-05-29 19:38:59.525');
INSERT INTO public.rate_limits VALUES ('bc27ce1a-a43f-486d-86b8-251252aa8403', '689908348614737960', 'checkout', 1, '2026-05-29 20:25:54.509', '2026-05-29 20:25:24.517', '2026-05-29 20:25:24.517');
INSERT INTO public.rate_limits VALUES ('485c55db-059a-480f-8dcb-3fac4f906a85', '689908348614737960', 'checkout', 1, '2026-06-01 17:59:38.388', '2026-06-01 17:59:08.391', '2026-06-01 17:59:08.391');


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: discord
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: discord
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: discord
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: product_types product_types_pkey; Type: CONSTRAINT; Schema: public; Owner: discord
--

ALTER TABLE ONLY public.product_types
    ADD CONSTRAINT product_types_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: discord
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: rate_limits rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: discord
--

ALTER TABLE ONLY public.rate_limits
    ADD CONSTRAINT rate_limits_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_action_idx; Type: INDEX; Schema: public; Owner: discord
--

CREATE INDEX audit_logs_action_idx ON public.audit_logs USING btree (action);


--
-- Name: audit_logs_createdAt_idx; Type: INDEX; Schema: public; Owner: discord
--

CREATE INDEX "audit_logs_createdAt_idx" ON public.audit_logs USING btree ("createdAt");


--
-- Name: audit_logs_discordUserId_idx; Type: INDEX; Schema: public; Owner: discord
--

CREATE INDEX "audit_logs_discordUserId_idx" ON public.audit_logs USING btree ("discordUserId");


--
-- Name: orders_discordUserId_idx; Type: INDEX; Schema: public; Owner: discord
--

CREATE INDEX "orders_discordUserId_idx" ON public.orders USING btree ("discordUserId");


--
-- Name: orders_productId_idx; Type: INDEX; Schema: public; Owner: discord
--

CREATE INDEX "orders_productId_idx" ON public.orders USING btree ("productId");


--
-- Name: orders_status_idx; Type: INDEX; Schema: public; Owner: discord
--

CREATE INDEX orders_status_idx ON public.orders USING btree (status);


--
-- Name: product_types_name_key; Type: INDEX; Schema: public; Owner: discord
--

CREATE UNIQUE INDEX product_types_name_key ON public.product_types USING btree (name);


--
-- Name: products_category_idx; Type: INDEX; Schema: public; Owner: discord
--

CREATE INDEX products_category_idx ON public.products USING btree (category);


--
-- Name: products_channelId_idx; Type: INDEX; Schema: public; Owner: discord
--

CREATE INDEX "products_channelId_idx" ON public.products USING btree ("channelId");


--
-- Name: products_status_idx; Type: INDEX; Schema: public; Owner: discord
--

CREATE INDEX products_status_idx ON public.products USING btree (status);


--
-- Name: rate_limits_discordUserId_action_resetAt_key; Type: INDEX; Schema: public; Owner: discord
--

CREATE UNIQUE INDEX "rate_limits_discordUserId_action_resetAt_key" ON public.rate_limits USING btree ("discordUserId", action, "resetAt");


--
-- Name: rate_limits_discordUserId_idx; Type: INDEX; Schema: public; Owner: discord
--

CREATE INDEX "rate_limits_discordUserId_idx" ON public.rate_limits USING btree ("discordUserId");


--
-- Name: orders orders_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: discord
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 0y4ip0naUnFTnLgAIAspZmrgL3QwM6UPBWX7tkUS5dh8njiYMZ3Y4jV6vHSCbEA

