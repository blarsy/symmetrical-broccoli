--
-- PostgreSQL database dump
--

-- Dumped from database version 15.3 (Debian 15.3-1.pgdg120+1)
-- Dumped by pg_dump version 15.4

-- Started on 2023-12-30 14:38:42 CET

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
-- TOC entry 3476 (class 0 OID 16455)
-- Dependencies: 222
-- Data for Name: accounts; Type: TABLE DATA; Schema: sb; Owner: sb
--

COPY sb.accounts (id, name, email, hash, salt, recovery_code, recovery_code_expiration, created) FROM stdin;
3	Google test1	test1@gmail.com	$1$ShG3Pc39$Xe0WaNvu5XYLIIC9PXVC/0	$1$ShG3Pc39	\N	\N	2023-12-30 13:37:30.533419
4	Google test2	test2@gmail.com	$1$HGJ52zHX$O.g30hvs2j1SWhT7Opss/0	$1$HGJ52zHX	\N	\N	2023-12-30 13:37:30.533419
5	Google test3	test3@gmail.com	$1$38O7oNR3$6ui7jVxDjd.6hCxbAUu9O1	$1$38O7oNR3	\N	\N	2023-12-30 13:37:30.533419
6	Apple tester	test@apple.com	$1$g3bvTstY$rGV8F1kZV9W1FB/x0ce0c.	$1$g3bvTstY	\N	\N	2023-12-30 13:37:30.533419
\.

--
-- TOC entry 3478 (class 0 OID 16463)
-- Dependencies: 224
-- Data for Name: conversations; Type: TABLE DATA; Schema: sb; Owner: sb
--

COPY sb.conversations (id, resource_id, last_message, created) FROM stdin;
\.


--
-- TOC entry 3484 (class 0 OID 16485)
-- Dependencies: 230
-- Data for Name: participants; Type: TABLE DATA; Schema: sb; Owner: sb
--

COPY sb.participants (id, account_id, conversation_id, created) FROM stdin;
\.


--
-- TOC entry 3482 (class 0 OID 16477)
-- Dependencies: 228
-- Data for Name: messages; Type: TABLE DATA; Schema: sb; Owner: sb
--

COPY sb.messages (id, participant_id, text, received, created) FROM stdin;
\.


--
-- TOC entry 3485 (class 0 OID 16490)
-- Dependencies: 231
-- Data for Name: resource_categories; Type: TABLE DATA; Schema: sb; Owner: sb
--

COPY sb.resource_categories (name, locale, created, code) FROM stdin;
Déco	fr	2023-12-25 11:55:08.691385	1
Transport	fr	2023-12-25 11:55:08.691385	2
Alimentation	fr	2023-12-25 11:55:08.691385	3
Jardin	fr	2023-12-25 11:55:08.691385	4
Sport & loisirs	fr	2023-12-25 11:55:08.691385	5
Santé & confort	fr	2023-12-25 11:55:08.691385	6
Matériaux construction & outillage	fr	2023-12-25 11:55:08.691385	7
Electronique & technologie	fr	2023-12-25 11:55:08.691385	8
Livres & éducation	fr	2023-12-25 11:55:08.691385	9
Divers	fr	2023-12-25 11:55:08.691385	10
Habillement	fr	2023-12-25 11:55:08.691385	11
Meubles	fr	2023-12-25 11:55:08.691385	12
Decoration	en	2023-12-25 11:55:08.691385	1
Transport	en	2023-12-25 11:55:08.691385	2
Food & beverage	en	2023-12-25 11:55:08.691385	3
Garden	en	2023-12-25 11:55:08.691385	4
Sport & leisure	en	2023-12-25 11:55:08.691385	5
Health & comfort	en	2023-12-25 11:55:08.691385	6
Building material & tools	en	2023-12-25 11:55:08.691385	7
Electronics & technology	en	2023-12-25 11:55:08.691385	8
Books & education	en	2023-12-25 11:55:08.691385	9
Misc	en	2023-12-25 11:55:08.691385	10
Clothing	en	2023-12-25 11:55:08.691385	11
Furnitures	en	2023-12-25 11:55:08.691385	12
\.


--
-- TOC entry 3494 (class 0 OID 0)
-- Dependencies: 221
-- Name: accounts_id_seq; Type: SEQUENCE SET; Schema: sb; Owner: sb
--

SELECT pg_catalog.setval('sb.accounts_id_seq', 6, true);


--
-- TOC entry 3495 (class 0 OID 0)
-- Dependencies: 223
-- Name: conversations_id_seq; Type: SEQUENCE SET; Schema: sb; Owner: sb
--

SELECT pg_catalog.setval('sb.conversations_id_seq', 1, false);


--
-- TOC entry 3496 (class 0 OID 0)
-- Dependencies: 225
-- Name: images_id_seq; Type: SEQUENCE SET; Schema: sb; Owner: sb
--

SELECT pg_catalog.setval('sb.images_id_seq', 17, true);


--
-- TOC entry 3497 (class 0 OID 0)
-- Dependencies: 227
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: sb; Owner: sb
--

SELECT pg_catalog.setval('sb.messages_id_seq', 1, false);


--
-- TOC entry 3498 (class 0 OID 0)
-- Dependencies: 229
-- Name: participants_id_seq; Type: SEQUENCE SET; Schema: sb; Owner: sb
--

SELECT pg_catalog.setval('sb.participants_id_seq', 1, false);


--
-- TOC entry 3499 (class 0 OID 0)
-- Dependencies: 232
-- Name: resource_categories_id_seq; Type: SEQUENCE SET; Schema: sb; Owner: sb
--

SELECT pg_catalog.setval('sb.resource_categories_id_seq', 1, false);


--
-- TOC entry 3500 (class 0 OID 0)
-- Dependencies: 219
-- Name: resources_id_seq; Type: SEQUENCE SET; Schema: sb; Owner: sb
--

SELECT pg_catalog.setval('sb.resources_id_seq', 8, true);


-- Completed on 2023-12-30 14:38:42 CET

--
-- PostgreSQL database dump complete
--

