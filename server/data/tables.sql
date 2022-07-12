CREATE TABLE IF NOT EXISTS `user` (
  `id` int(5) NOT NULL AUTO_INCREMENT,
  `username` varchar(30) NOT NULL,
  `first_name` varchar(255),
  `last_name` varchar(255),
  `passwd` varchar(255)
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

INSERT INTO `user` (`username`, `first_name`, `last_name`, `passwd`) VALUES
    (NULL, 'admin', 'SUPER', 'ADMIN', 'a260aac0b2df3cfdab526689fd1660a3f9871ab17b618e1513812508eb042654'),
    (1, 'user1', 'Robin', 'Hood', '8529a401fb906ef05fd89daf4789772fbba71e967ac25cf105476e8057d37030'),
    (2, 'user2', 'John', 'Doe', '8529a401fb906ef05fd89daf4789772fbba71e967ac25cf105476e8057d37030')
;

CREATE TABLE IF NOT EXISTS `settings` (
  `id` int(5) NOT NULL AUTO_INCREMENT,
  `key` varchar(30) NOT NULL,
  `label` varchar(255) NOT NULL,
  `post_input` varchar(255),
  `value_string` varchar(255),
  `value_text` longtext,
  `value_integer` int(11),
  `value_float` double,
  `value_decimal` decimal,
  `value_date` date,
  `value_datetime` datetime,
  `value_json_array` json,
  `value_boolean` tinyint(1),
  `min_value_integer` int(11),
  `max_value_integer` int(11),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

INSERT INTO `settings` (`key`, `label`, `post_input`, `value_integer`, `min_value_integer`, `max_value_integer`, `value_text`) VALUES
    ('t1', 'Tiempo de parpadeo nueva entrada', 'seg.', 10, 1, 60),
    ('t2', 'Tiempo de visualización de cada página', 'seg.', 20, 1, 300),
    ('t3', 'Tiempo de duración de la entrada en pantalla. Borrado automático', 'min.', 2, 1, 60),
    ('t4', 'Tiempo previo de aviso de borrado automático', 'seg.', 30, 0, 60,NULL),
    ('pageSize', 'Número de elementos por página', '', 7, 1, 10),
    ('transports', 'Lista de transportes separados por ","', '', NULL, NULL, NULL, 'SEUR,ASMES,DHLES,CHRONO,DHLPE,FERCA,GIRTEKA,KREISS,LKWWT,LOGEO,MRWXX,SCHNK,SLAM,TROTA,UPSN,VOSNL,XPOES')
;

CREATE TABLE IF NOT EXISTS `truck` (
  `id` int(5) NOT NULL AUTO_INCREMENT,
  `matricula` varchar(30) NOT NULL,
  `transporte` varchar(255),
  `dock` varchar(30),
  `created` timestamp DEFAULT NULL,
  `deleted` timestamp DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;


INSERT INTO `truck` (`matricula`, `transporte`, `dock`, `created`, `deleted`) VALUES
    ('5649-BRT', 'SEUR', '18', '2019-01-01 01:00:00', NULL),
    ('5650-BRT', 'ASMES', '18', '2019-01-01 02:00:00', NULL),
    ('5651-BRT', 'DHLES', '18', '2019-01-01 00:01:00', NULL)

